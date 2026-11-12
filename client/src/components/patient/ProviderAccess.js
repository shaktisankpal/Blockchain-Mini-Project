import { useEffect, useMemo, useState } from "react";
import paitientService from "../../services/patientService";
import Icon from "../../common/icons";
import { Badge, Empty, Loading, Notice, Page, Toggle, errorMessage, inputClass } from "../../common/ui";

// Field shown under each provider, per organisation (keys come from the ledger profile).
const DETAILS = {
  doctor: [
    ["department", "Department"],
    ["degree", "Degree"],
    ["specialization", "Specialisation"],
    ["contact", "Contact"],
  ],
  pharmacy: [["address", "Address"], ["contact", "Contact"]],
  lab: [["address", "Address"], ["contact", "Contact"]],
  insurance: [["address", "Address"], ["contact", "Contact"]],
};

const ICONS = { doctor: "heart", pharmacy: "pill", lab: "beaker", insurance: "umbrella" };

/**
 * Lists every provider of one organisation from the ledger and lets the patient grant or
 * revoke access to their records.
 */
export default function ProviderAccess({ orgName, title, noun, plural = `${noun}s`, subtitle }) {
  const [providers, setProviders] = useState(null);
  const [access, setAccess] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await paitientService.getOrganizationList(orgName);
        setProviders(res.data.records || []);
        setAccess((res.data.access || []).map(Number));
      } catch (e) {
        setProviders([]);
        setError(errorMessage(e, `Could not load the ${noun} list`));
      }
    })();
  }, [orgName, noun]);

  const idOf = (p) => Number(p[`${orgName}Id`]);

  const toggle = async (provider, grant) => {
    const id = idOf(provider);
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const res = grant ? await paitientService.giveAccess(id) : await paitientService.removeAccess(id);
      if (!res.data.success) throw new Error(res.data.message);
      setAccess((prev) => (grant ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
      setNotice(grant ? `${provider.name} can now see your records.` : `${provider.name} can no longer see your records.`);
    } catch (e) {
      setError(errorMessage(e, "Could not update access"));
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (providers || []).filter((p) => !q || Object.values(p).some((v) => typeof v === "string" && v.toLowerCase().includes(q)));
    // Providers with access first.
    return list.sort((a, b) => Number(access.includes(idOf(b))) - Number(access.includes(idOf(a))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, access, search]);

  const granted = (providers || []).filter((p) => access.includes(idOf(p))).length;

  return (
    <Page
      label="Access control"
      title={title}
      subtitle={subtitle}
      actions={
        providers && providers.length > 0 ? (
          <Badge tone="lime">
            {granted} of {providers.length} with access
          </Badge>
        ) : null
      }
    >
      <div className="mb-6 space-y-3">
        <Notice>{error}</Notice>
        <Notice tone="success">{notice}</Notice>
      </div>

      {providers === null ? (
        <Loading />
      ) : providers.length === 0 ? (
        <Empty icon={ICONS[orgName]} title={`No ${plural} registered yet`}>
          The network administrator adds {plural}. They will appear here once registered on the ledger.
        </Empty>
      ) : (
        <>
          <div className="relative mb-6 max-w-sm">
            <input className={inputClass} placeholder={`Search ${plural}`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const id = idOf(p);
              const has = access.includes(id);
              return (
                <div key={id} className={`card flex flex-col p-5 transition ${has ? "border-lime/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${has ? "bg-lime text-black" : "bg-white/[0.05] text-neutral-400"}`}>
                        <Icon name={ICONS[orgName]} className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-neutral-500">ID {id}{p.gender ? ` · ${p.gender}` : ""}</div>
                      </div>
                    </div>
                    <Toggle checked={has} disabled={busyId === id} onChange={(v) => toggle(p, v)} label={`Access for ${p.name}`} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {DETAILS[orgName]
                      .filter(([key]) => p[key])
                      .map(([key, label]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-xs text-neutral-500">{label}</dt>
                          <dd className="truncate text-neutral-200">{p[key]}</dd>
                        </div>
                      ))}
                  </dl>
                  <div className="mt-4 text-xs">
                    {busyId === id ? (
                      <span className="text-neutral-400">Updating…</span>
                    ) : has ? (
                      <span className="text-lime">Can see your records</span>
                    ) : (
                      <span className="text-neutral-500">No access</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Page>
  );
}
