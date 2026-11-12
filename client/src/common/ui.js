import Icon from "./icons";
import Loader from "./loader";

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export const formatMoney = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : `₹${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Page wrapper with the eyebrow label + title used across the dark theme.
export function Page({ label, title, subtitle, actions, children, narrow }) {
  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-ink">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className={`relative mx-auto px-4 pb-20 pt-12 sm:px-6 lg:px-8 ${narrow ? "max-w-3xl" : "max-w-7xl"}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {label && <span className="label">{label}</span>}
            <h1 className="mt-3 font-display text-3xl font-medium text-white sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-neutral-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

const BADGE_TONES = {
  lime: "border-lime/30 bg-lime/10 text-lime",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300",
  neutral: "border-white/10 bg-white/[0.04] text-neutral-400",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

// Claim status on the ledger: "in process" | "Approve" | "Decline".
export function ClaimBadge({ insurance }) {
  if (!insurance) return <Badge>Not claimed</Badge>;
  const s = String(insurance.status).toLowerCase();
  if (s.startsWith("approve")) return <Badge tone="lime">Approved</Badge>;
  if (s.startsWith("decline") || s.startsWith("reject")) return <Badge tone="red">Declined</Badge>;
  return <Badge tone="amber">In review</Badge>;
}

export function Notice({ tone = "error", children }) {
  if (!children) return null;
  const cls = tone === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-lime/30 bg-lime/10 text-lime";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function Empty({ icon = "doc", title, children }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-neutral-400">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-neutral-400">{children}</div>}
    </div>
  );
}

export function Loading({ label = "Reading from the ledger…" }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-sm text-neutral-500">
      <Loader />
      {label}
    </div>
  );
}

// Accessible on/off switch.
export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:opacity-50 ${
        checked ? "border-lime bg-lime" : "border-white/15 bg-white/10"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full transition ${checked ? "translate-x-6 bg-black" : "translate-x-1 bg-neutral-300"}`} />
    </button>
  );
}

export const inputClass =
  "block w-full rounded-xl border border-white/10 bg-ink-700 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 transition focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

// Pull a readable message out of an axios error.
export const errorMessage = (error, fallback = "Something went wrong!") =>
  error?.response?.data?.message || error?.message || fallback;
