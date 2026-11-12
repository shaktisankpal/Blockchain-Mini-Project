import PatientRecordsView, { StatRow } from "./PatientRecordsView";
import { formatMoney } from "../../common/ui";

function PharmacyRecords() {
  return (
    <PatientRecordsView
      title="Pharmacy Records"
      subtitle="Medicines prescribed to you and what the pharmacy dispensed and billed."
      show={["medicines"]}
      emptyIcon="pill"
      emptyTitle="No prescriptions yet"
      emptyText="Medicines show up here once a doctor prescribes them."
      summary={(records) => (
        <StatRow
          items={[
            { label: "Prescriptions", value: records.length },
            { label: "Dispensed", value: records.filter((r) => r.dispensed).length, accent: true },
            { label: "Total billed", value: formatMoney(records.reduce((sum, r) => sum + (r.medicineBill || 0), 0)) },
          ]}
        />
      )}
    />
  );
}

export default PharmacyRecords;
