import Icon from "./icons";
import { Badge, ClaimBadge, formatDate, formatMoney } from "./ui";

function Section({ icon, title, right, children }) {
  return (
    <div className="border-t border-white/[0.06] px-5 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name={icon} className="h-4 w-4 text-lime" />
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function MedicineStatus({ medicine, dispensed }) {
  if (!dispensed) return <Badge>Pending</Badge>;
  if (medicine.dispensed === false) return <Badge tone="red">Not available</Badge>;
  return <Badge tone="lime">Dispensed</Badge>;
}

/**
 * One prescription record as stored on the ledger.
 * `show` picks the sections: any of "medicines", "lab", "claim" (diagnosis is always shown).
 * `children` renders below the record (e.g. a provider's action form).
 */
export default function RecordCard({ record, show = ["medicines", "lab", "claim"], showPatient = false, children }) {
  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-white">Record #{record.recordId}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span>{formatDate(record.createdAt)}</span>
            <span>Dr. {record.doctorName || record.doctorId}</span>
            {showPatient && <span>Patient: {record.patientName || record.patientId}</span>}
          </div>
        </div>
        {show.includes("claim") && <ClaimBadge insurance={record.insurance} />}
      </header>

      <div className="border-t border-white/[0.06] px-5 py-4 sm:px-6">
        <div className="text-xs uppercase tracking-wider text-neutral-500">Diagnosis</div>
        <p className="mt-1 text-sm text-neutral-200">{record.diagnosis || "—"}</p>
      </div>

      {show.includes("medicines") && (
        <Section
          icon="pill"
          title="Medicines"
          right={record.dispensed ? <span className="text-xs text-neutral-400">Bill {formatMoney(record.medicineBill)}</span> : <Badge>Not dispensed yet</Badge>}
        >
          {record.medicines.length === 0 ? (
            <p className="text-sm text-neutral-500">No medicines prescribed.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {record.medicines.map((m, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <span className="text-neutral-100">{m.name}</span>
                    {m.dose && <span className="ml-2 text-neutral-500">{m.dose}</span>}
                    {m.comment && <div className="text-xs text-neutral-500">Pharmacy note: {m.comment}</div>}
                  </div>
                  <MedicineStatus medicine={m} dispensed={record.dispensed} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {show.includes("lab") && (
        <Section
          icon="beaker"
          title="Lab tests"
          right={record.labReported ? <span className="text-xs text-neutral-400">Bill {formatMoney(record.labBill)}</span> : <Badge>Awaiting report</Badge>}
        >
          {record.labTests.length === 0 ? (
            <p className="text-sm text-neutral-500">No lab tests ordered.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {record.labTests.map((t, i) => (
                <li key={i} className="py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-neutral-100">{t.name}</span>
                    {t.report ? <Badge tone="lime">Reported {formatDate(t.reportDate)}</Badge> : <Badge>Pending</Badge>}
                  </div>
                  {t.report && <p className="mt-1 whitespace-pre-wrap text-neutral-400">{t.report}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {show.includes("claim") && record.insurance && (
        <Section icon="umbrella" title="Insurance claim">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">Filed</div>
              <div className="text-neutral-200">{formatDate(record.insurance.claimRequestDate)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Answered</div>
              <div className="text-neutral-200">{formatDate(record.insurance.claimResponseDate)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Claim total</div>
              <div className="text-neutral-200">{formatMoney((record.medicineBill || 0) + (record.labBill || 0))}</div>
            </div>
          </div>
        </Section>
      )}

      {children && <div className="border-t border-white/[0.06] bg-ink-900/60 px-5 py-4 sm:px-6">{children}</div>}
    </article>
  );
}
