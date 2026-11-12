import { useState } from "react";
import PatientRecordsView, { StatRow } from "./PatientRecordsView";
import paitientService from "../../services/patientService";
import authService from "../../services/authService";
import { Notice, errorMessage, formatMoney } from "../../common/ui";

// "File a claim" button shown on records that have no claim yet.
function ClaimAction({ record, reload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (record.insurance) {
    return <p className="text-xs text-neutral-500">Claim filed. Your insurer reviews it from their portal.</p>;
  }

  const file = async () => {
    setBusy(true);
    setError("");
    try {
      await paitientService.postclaimrequest({ recordId: record.recordId, patientId: authService.getId() });
      await reload();
    } catch (e) {
      setError(errorMessage(e, "Could not file the claim"));
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-neutral-500">
        Claim total {formatMoney((record.medicineBill || 0) + (record.labBill || 0))}
      </span>
      <button className="btn-lime !px-4 !py-2 !text-xs" onClick={file} disabled={busy}>
        {busy ? "Filing…" : "File insurance claim"}
      </button>
      {error && <div className="w-full"><Notice>{error}</Notice></div>}
    </div>
  );
}

function InsuranceRecords() {
  return (
    <PatientRecordsView
      title="Insurance Records"
      subtitle="File claims for your records and follow their status. Your insurer must have access to review them."
      show={["medicines", "lab", "claim"]}
      emptyIcon="umbrella"
      emptyTitle="No records to claim"
      emptyText="You can file a claim once a doctor has written a prescription for you."
      summary={(records) => {
        const claims = records.filter((r) => r.insurance);
        const status = (r) => String(r.insurance.status).toLowerCase();
        return (
          <StatRow
            items={[
              { label: "Claims filed", value: claims.length },
              { label: "Approved", value: claims.filter((r) => status(r).startsWith("approve")).length, accent: true },
              { label: "In review", value: claims.filter((r) => status(r) === "in process").length },
            ]}
          />
        );
      }}
      renderActions={(record, reload) => <ClaimAction record={record} reload={reload} />}
    />
  );
}

export default InsuranceRecords;
