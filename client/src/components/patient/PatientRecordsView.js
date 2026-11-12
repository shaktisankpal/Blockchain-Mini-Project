import { useCallback, useEffect, useState } from "react";
import paitientService from "../../services/patientService";
import RecordCard from "../../common/RecordCard";
import { Empty, Loading, Notice, Page, errorMessage } from "../../common/ui";

// Shared page for the patient's record views. Data comes from the ledger via /patient-health-records.
export default function PatientRecordsView({ label = "Patient portal", title, subtitle, show, emptyTitle, emptyText, emptyIcon, summary, renderActions }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await paitientService.getHealthRecords();
      setRecords(res.data.recordsData || []);
    } catch (e) {
      setRecords([]);
      setError(errorMessage(e, "Could not load your records"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Page label={label} title={title} subtitle={subtitle}>
      {error && <div className="mb-6"><Notice>{error}</Notice></div>}
      {records === null ? (
        <Loading />
      ) : records.length === 0 ? (
        <Empty icon={emptyIcon} title={emptyTitle}>{emptyText}</Empty>
      ) : (
        <>
          {summary && <div className="mb-8">{summary(records)}</div>}
          <div className="grid gap-5 lg:grid-cols-2">
            {records.map((r) => (
              <RecordCard key={r.recordId} record={r} show={show}>
                {renderActions ? renderActions(r, load) : null}
              </RecordCard>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

// Row of small stat tiles computed from the records.
export function StatRow({ items }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
      {items.map((s) => (
        <div key={s.label} className="bg-ink-800 px-5 py-4">
          <div className="label">{s.label}</div>
          <div className={`mt-1 font-display text-3xl font-medium ${s.accent ? "text-lime" : "text-white"}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
