import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import paitientService from "../../services/patientService";
import authService from "../../services/authService";
import RecordCard from "../../common/RecordCard";
import Icon from "../../common/icons";
import { Badge, Empty, Field, Loading, Notice, Page, Toggle, errorMessage, formatDate, inputClass } from "../../common/ui";

const ROLE_COPY = {
  doctor: { label: "Doctor portal", title: "Your Patients", show: ["medicines", "lab", "claim"], subtitle: "Patients who granted you access. Review their full history and write new prescriptions." },
  pharmacy: { label: "Pharmacy portal", title: "Dispense & Bill", show: ["medicines"], subtitle: "Prescribed medicines for patients who granted you access. Record what you dispensed and the bill." },
  lab: { label: "Lab portal", title: "Tests & Reports", show: ["lab"], subtitle: "Lab tests ordered for patients who granted you access. Add each test's report and the bill." },
  insurance: { label: "Insurance portal", title: "Claim Requests", show: ["medicines", "lab", "claim"], subtitle: "Claims filed by patients who granted you access. Approve or decline pending claims." },
};

// ---------- Pharmacy: mark medicines dispensed + bill ----------
function DispenseForm({ patientId, record, onDone }) {
  const [items, setItems] = useState(record.medicines.map((m) => ({ ...m, dispensed: true, comment: m.comment || "" })));
  const [bill, setBill] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (i, patch) => setItems((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await paitientService.postMedicinePharmacy({
        patientId,
        recordId: record.recordId,
        medicineBill: bill,
        medicines: items.map((m) => ({ name: m.name, dose: m.dose, dispensed: m.dispensed, comment: m.comment })),
      });
      await onDone("Dispensing recorded on the ledger.");
    } catch (err) {
      setError(errorMessage(err, "Could not save"));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm font-semibold text-white">Record dispensing</div>
      {items.map((m, i) => (
        <div key={i} className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm text-neutral-100">{m.name} <span className="text-neutral-500">{m.dose}</span></div>
            {!m.dispensed && (
              <input className={`${inputClass} mt-2`} placeholder="Note, e.g. out of stock" value={m.comment} onChange={(e) => update(i, { comment: e.target.value })} />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {m.dispensed ? "Dispensed" : "Not available"}
            <Toggle checked={m.dispensed} onChange={(v) => update(i, { dispensed: v })} label={`Dispensed ${m.name}`} />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Field label="Bill (₹)">
            <input className={inputClass} type="number" min="0" step="0.01" required value={bill} onChange={(e) => setBill(e.target.value)} />
          </Field>
        </div>
        <button className="btn-lime !py-2.5" disabled={busy}>{busy ? "Writing to ledger…" : "Save & bill"}</button>
      </div>
      <Notice>{error}</Notice>
    </form>
  );
}

// ---------- Lab: add a report per test + bill ----------
function LabReportForm({ patientId, record, onDone }) {
  const [reports, setReports] = useState(record.labTests.map((t) => t.report || ""));
  const [bill, setBill] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const now = new Date().toISOString();
      await paitientService.postLabReport({
        patientId,
        recordId: record.recordId,
        labBill: bill,
        labReport: record.labTests.map((t, i) => ({ name: t.name, labReport: { report: reports[i], dateOfReport: now } })),
      });
      await onDone("Lab report recorded on the ledger.");
    } catch (err) {
      setError(errorMessage(err, "Could not save"));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm font-semibold text-white">Add lab report</div>
      {record.labTests.map((t, i) => (
        <Field key={i} label={t.name}>
          <textarea
            className={`${inputClass} min-h-[72px]`}
            required
            placeholder="Findings / result"
            value={reports[i]}
            onChange={(e) => setReports((prev) => prev.map((r, j) => (j === i ? e.target.value : r)))}
          />
        </Field>
      ))}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Field label="Bill (₹)">
            <input className={inputClass} type="number" min="0" step="0.01" required value={bill} onChange={(e) => setBill(e.target.value)} />
          </Field>
        </div>
        <button className="btn-lime !py-2.5" disabled={busy}>{busy ? "Writing to ledger…" : "Submit report"}</button>
      </div>
      <Notice>{error}</Notice>
    </form>
  );
}

// ---------- Insurance: approve / decline a pending claim ----------
function ClaimDecision({ patientId, record, onDone }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const decide = async (status) => {
    setBusy(status);
    setError("");
    try {
      await paitientService.postInsuranceResponse({ patientId, recordId: record.recordId, status });
      await onDone(status === "Approve" ? "Claim approved." : "Claim declined.");
    } catch (err) {
      setError(errorMessage(err, "Could not save the decision"));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-neutral-300">Claim filed {formatDate(record.insurance.claimRequestDate)}. Decide:</span>
        <div className="flex gap-3">
          <button className="btn-outline !border-red-400/40 !text-red-200 hover:!bg-red-400/10" disabled={!!busy} onClick={() => decide("Decline")}>
            {busy === "Decline" ? "Saving…" : "Decline"}
          </button>
          <button className="btn-lime !px-5 !py-2" disabled={!!busy} onClick={() => decide("Approve")}>
            {busy === "Approve" ? "Saving…" : "Approve"}
          </button>
        </div>
      </div>
      <Notice>{error}</Notice>
    </div>
  );
}

function recordAction(role, patientId, record, onDone) {
  if (role === "pharmacy") {
    if (record.dispensed) return null;
    if (record.medicines.length === 0) return <p className="text-xs text-neutral-500">No medicines on this prescription.</p>;
    return <DispenseForm patientId={patientId} record={record} onDone={onDone} />;
  }
  if (role === "lab") {
    if (record.labReported) return null;
    if (record.labTests.length === 0) return <p className="text-xs text-neutral-500">No lab tests on this prescription.</p>;
    return <LabReportForm patientId={patientId} record={record} onDone={onDone} />;
  }
  if (role === "insurance" && record.insurance && record.insurance.status === "in process") {
    return <ClaimDecision patientId={patientId} record={record} onDone={onDone} />;
  }
  return null;
}

// Which records each role works on.
const relevant = (role, r) =>
  role === "pharmacy" ? r.medicines.length > 0 : role === "lab" ? r.labTests.length > 0 : role === "insurance" ? !!r.insurance : true;

// Count of records waiting for this role.
const pendingCount = (role, records) =>
  records.filter((r) =>
    role === "pharmacy" ? r.medicines.length > 0 && !r.dispensed
    : role === "lab" ? r.labTests.length > 0 && !r.labReported
    : role === "insurance" ? r.insurance && r.insurance.status === "in process"
    : false
  ).length;

function PaitentsRecords() {
  const role = authService.getRole();
  const copy = ROLE_COPY[role] || ROLE_COPY.doctor;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [patients, setPatients] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await paitientService.getPatientAccessList();
      setPatients((res.data.accessMemberDetails || []).filter((p) => p.patientId));
    } catch (e) {
      setPatients([]);
      setError(errorMessage(e, "Could not load your patients"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedId = params.get("patient") || (patients && patients[0] && String(patients[0].patientId));
  const selected = patients && patients.find((p) => String(p.patientId) === String(selectedId));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (patients || []).filter((p) => !q || String(p.name).toLowerCase().includes(q) || String(p.patientId).includes(q));
  }, [patients, search]);

  const onDone = async (message) => {
    setNotice(message);
    await load();
  };

  const records = selected ? (selected.medicalRecords || []).filter((r) => relevant(role, r)) : [];

  return (
    <Page
      label={copy.label}
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        role === "doctor" && selected ? (
          <button className="btn-lime" onClick={() => navigate(`/add-patient-records?patientId=${selected.patientId}`)}>
            New prescription <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
          </button>
        ) : null
      }
    >
      <div className="mb-6 space-y-3">
        <Notice>{error}</Notice>
        <Notice tone="success">{notice}</Notice>
      </div>

      {patients === null ? (
        <Loading />
      ) : patients.length === 0 ? (
        <Empty icon="users" title="No patients yet">
          Patients appear here after they grant you access from their portal.
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Patient list */}
          <aside className="space-y-3">
            <input className={inputClass} placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="card divide-y divide-white/[0.05] overflow-hidden">
              {filtered.map((p) => {
                const active = String(p.patientId) === String(selectedId);
                const waiting = pendingCount(role, p.medicalRecords || []);
                return (
                  <button
                    key={p.patientId}
                    onClick={() => { setNotice(""); setParams({ patient: p.patientId }); }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${active ? "bg-lime/10" : "hover:bg-white/[0.03]"}`}
                  >
                    <div className="min-w-0">
                      <div className={`truncate text-sm font-medium ${active ? "text-lime" : "text-white"}`}>{p.name}</div>
                      <div className="text-xs text-neutral-500">ID {p.patientId} · {(p.medicalRecords || []).length} records</div>
                    </div>
                    {waiting > 0 && <Badge tone="amber">{waiting}</Badge>}
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="px-4 py-6 text-sm text-neutral-500">No match.</div>}
            </div>
          </aside>

          {/* Selected patient */}
          <section className="min-w-0 space-y-5">
            {selected && (
              <div className="card grid gap-4 p-5 sm:grid-cols-4">
                <div className="sm:col-span-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-lime"><Icon name="user" className="h-5 w-5" /></span>
                  <div>
                    <div className="font-display text-xl font-semibold text-white">{selected.name}</div>
                    <div className="text-xs text-neutral-500">Patient ID {selected.patientId}</div>
                  </div>
                </div>
                {[["Gender", selected.gender], ["Date of birth", selected.dob], ["Blood group", selected.bloodGroup], ["Contact", selected.contact]].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-neutral-500">{k}</div>
                    <div className="text-sm text-neutral-200">{v || "—"}</div>
                  </div>
                ))}
              </div>
            )}

            {records.length === 0 ? (
              <Empty icon="doc" title="Nothing here yet">
                {role === "insurance" ? "This patient has not filed any claims." : role === "doctor" ? "No prescriptions yet. Use New prescription to write one." : "No prescriptions for you to handle yet."}
              </Empty>
            ) : (
              records.map((r) => (
                <RecordCard key={r.recordId} record={r} show={copy.show}>
                  {recordAction(role, selected.patientId, r, onDone)}
                </RecordCard>
              ))
            )}
          </section>
        </div>
      )}
    </Page>
  );
}

export default PaitentsRecords;
