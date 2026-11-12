import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import httpService from "../services/httpService";
import Icon, { LogoMark } from "../common/icons";

// Live network numbers from GET /api/stats (MongoDB counts + the chain's block height and peers).
function useNetworkStats() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () =>
      httpService
        .get("/stats")
        .then((res) => alive && (setStats(res.data.stats), setFailed(false)))
        .catch(() => alive && setFailed(true));
    load();
    const timer = setInterval(load, 15000); // new blocks show up without a reload
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  return { stats, failed };
}

const fmt = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString());
const count = (n, one, many = `${one}s`) => `${fmt(n)} ${Number(n) === 1 ? one : many}`;

const ORGS = [
  { name: "Patient", icon: "user" },
  { name: "Doctor", icon: "heart" },
  { name: "Pharmacy", icon: "pill" },
  { name: "Lab", icon: "beaker" },
  { name: "Insurance", icon: "umbrella" },
];

// Built from live data; "—" until it loads.
const buildStats = (s) => [
  {
    label: "Blocks on the ledger",
    value: fmt(s && s.chain ? s.chain.blockHeight : null),
    note: s && s.chain ? `${s.chain.peers} peers across ${s.chain.organisations.length} organisations are online` : "Waiting for the network…",
    className: "stat-violet",
  },
  {
    label: "Prescription records",
    value: fmt(s && s.records),
    note: "Each one shared by doctor, pharmacy, lab and insurer",
    className: "text-lime",
  },
  {
    label: "Patients & providers",
    value: fmt(s && s.patients + s.providers),
    note: s
      ? [
          count(s.patients, "patient"),
          count(s.doctors, "doctor"),
          count(s.pharmacies, "pharmacy", "pharmacies"),
          count(s.labs, "lab"),
          count(s.insurers, "insurer"),
        ].join(" · ")
      : "",
    className: "text-neutral-300",
  },
];

const FEATURES = [
  { icon: "lock", title: "Patient-controlled access", body: "Patients decide which doctor, pharmacy, lab or insurer can see their records, and can revoke it at any time." },
  { icon: "link", title: "Tamper-evident history", body: "Prescriptions, bills, lab reports and claims are written to a shared Hyperledger Fabric ledger that no single party can rewrite." },
  { icon: "users", title: "Multi-party endorsement", body: "Each transaction must be endorsed by a majority of the five organisations before it is committed." },
  { icon: "grid", title: "A portal for every role", body: "Separate workspaces for patients, doctors, pharmacies, labs, insurers and administrators." },
];

const STEPS = [
  { icon: "lock", title: "Grant access", body: "The patient picks the providers allowed to see their records." },
  { icon: "doc", title: "Doctor prescribes", body: "Diagnosis, medicines and lab tests are recorded on the ledger." },
  { icon: "pill", title: "Pharmacy & lab fulfil", body: "Dispensed medicines, reports and bills are added to the same record." },
  { icon: "umbrella", title: "Insurer settles", body: "The patient files a claim and the insurer approves or declines it." },
];

// Small square tile with a faint icon, scattered around the hero like the reference.
function FloatTile({ icon, className }) {
  return (
    <div className={`absolute hidden h-16 w-16 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-500 md:flex ${className}`}>
      <Icon name={icon} className="h-7 w-7" />
    </div>
  );
}

// Orbit illustration: the shared ledger in the middle, the five organisations around it.
function LedgerOrbit() {
  const radius = 34; // percent of the box
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* light beam */}
      <div className="absolute left-1/2 top-0 h-1/2 w-14 -translate-x-1/2 animate-beam bg-gradient-to-b from-transparent via-lime/25 to-lime/60 blur-md" />
      {/* rings */}
      <div className="absolute inset-[16%] rounded-full border border-dashed border-lime/30" />
      <div className="absolute inset-[30%] rounded-full border border-white/[0.06]" />
      {/* centre node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-lime/30" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-lime text-black shadow-[0_0_60px_rgba(212,245,76,0.45)]">
          <Icon name="cube" className="h-7 w-7" strokeWidth={1.8} />
        </div>
      </div>
      {/* orbiting organisations */}
      <div className="absolute inset-0 animate-orbit">
        {ORGS.map((org, i) => {
          const angle = (i / ORGS.length) * 2 * Math.PI - Math.PI / 2;
          // Sit exactly on the dashed ring (inset 16% => radius 34% of the box).
          const left = 50 + Math.cos(angle) * radius;
          const top = 50 + Math.sin(angle) * radius;
          return (
            <div
              key={org.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="animate-orbit-reverse">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-ink-700 text-neutral-200 shadow-lg">
                  <Icon name={org.icon} className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const loggedIn = !!authService.getCurrentUser();
  const { stats, failed } = useNetworkStats();
  const chain = stats && stats.chain;

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-neutral-200">
      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
        <FloatTile icon="heart" className="left-[14%] top-10" />
        <FloatTile icon="pill" className="left-[6%] top-36" />
        <FloatTile icon="doc" className="left-[11%] top-72" />
        <FloatTile icon="beaker" className="right-[14%] top-10" />
        <FloatTile icon="shield" className="right-[6%] top-36" />
        <FloatTile icon="umbrella" className="right-[11%] top-72" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-20 text-center sm:pt-28">
          <div className="mb-8 flex w-full items-center justify-center gap-4">
            <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-lime/40 sm:block" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-label text-lime">
              <span>✦</span> Built on Hyperledger Fabric <span>✦</span>
            </span>
            <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-lime/40 sm:block" />
          </div>

          <h1 className="font-display text-4xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Patient-Owned Health Records
            <br className="hidden sm:block" /> on a Shared Ledger
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            One tamper-evident record shared by patients, doctors, pharmacies, labs and insurers, where the patient decides who gets access.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {loggedIn ? (
              <Link to="/dashboard" className="btn-lime">
                Open Dashboard <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-lime">Get Started</Link>
                <Link to="/login" className="btn-light">
                  Sign In <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Network participants strip */}
        <div id="network" className="relative mx-auto max-w-5xl scroll-mt-28 px-4 pb-24">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="label">Organisations on the network</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-neutral-500">
            {ORGS.map((org) => (
              <div key={org.name} className="flex items-center gap-2.5 transition hover:text-neutral-200">
                <Icon name={org.icon} className="h-6 w-6" />
                <span className="font-display text-lg font-semibold tracking-wide">{org.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-t border-white/[0.06] bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-block rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-neutral-300">The network</span>
            <h2 className="mt-6 max-w-sm font-display text-4xl font-medium leading-tight text-white">
              One Record, Five Organisations
            </h2>
            <Link to={loggedIn ? "/dashboard" : "/register"} className="btn-lime mt-8 !px-5 !py-2.5 !text-xs">
              {loggedIn ? "Go to dashboard" : "Join now"} <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2.4} />
            </Link>
          </div>
          <div className="space-y-10">
            {buildStats(stats).map((s) => (
              <div key={s.label}>
                <div className="flex items-center gap-4">
                  <span className="label whitespace-nowrap">{s.label}</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className={`mt-2 font-display text-6xl font-medium ${s.className}`}>{s.value}</div>
                {s.note && <div className="mt-1 text-sm text-neutral-500">{s.note}</div>}
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className={`h-2 w-2 rounded-full ${chain ? "bg-lime shadow-[0_0_10px_rgba(212,245,76,0.8)]" : failed ? "bg-red-400" : "bg-neutral-600"}`} />
              {chain
                ? `Live from the ledger · updated ${new Date(stats.updatedAt).toLocaleTimeString()}`
                : failed
                ? "Network unreachable. Start the backend to see live numbers."
                : "Connecting to the network…"}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Shared ledger + features ---------- */}
      <section id="features" className="scroll-mt-24 border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="label">Shared ledger</span>
            <h2 className="mt-6 max-w-md font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              Your Gateway to Tamper-Proof Health Records
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-neutral-400">
              Every prescription, dispensed medicine, lab report and insurance claim is stored on a permissioned blockchain.
              Each organisation runs its own peer, so every participant holds the same verified copy.
            </p>
            <a href="#how-it-works" className="btn-lime mt-8 !px-5 !py-2.5 !text-xs">
              Explore <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2.4} />
            </a>
          </div>

          <div className="card relative overflow-hidden p-6 sm:p-10">
            <div className="bg-grid absolute inset-0 opacity-60" />
            <div className="relative">
              <LedgerOrbit />
              <div className="absolute bottom-0 left-0 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/90 px-4 py-3 backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-black">
                  <Icon name="shield" className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                    {chain ? `Latest block #${fmt(chain.blockHeight - 1)}` : "Latest block"}
                  </div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {chain ? `${chain.latestBlockHash.slice(0, 10)}…${chain.latestBlockHash.slice(-6)}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border-y border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-ink p-8">
              <Icon name={f.icon} className="h-6 w-6 text-lime" />
              <h3 className="mt-5 text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-white/10 bg-ink-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-neutral-300">How it works</span>
            <div className="mt-5 flex w-full items-center gap-4">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
              <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">From Prescription to Claim, on One Ledger</h2>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
            </div>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card group p-6 transition hover:border-lime/30">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-lime">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm text-neutral-600">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.body}</p>
              </div>
            ))}
          </div>

          {!loggedIn && (
            <div className="card relative mt-20 overflow-hidden px-6 py-14 text-center">
              <div className="absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 rounded-full bg-lime/10 blur-3xl" />
              <h2 className="relative font-display text-3xl font-medium text-white sm:text-4xl">Take control of your health records</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-neutral-400">Register as a patient in a minute. Providers are added by the network administrator.</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn-lime">Create account</Link>
                <Link to="/login" className="btn-outline !px-6 !py-3">Sign in</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <span className="text-neutral-300">Healthcare Records</span>
          </div>
          <span>Hyperledger Fabric · CouchDB · React</span>
          <span>© {new Date().getFullYear()} Healthcare Record Platform</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
