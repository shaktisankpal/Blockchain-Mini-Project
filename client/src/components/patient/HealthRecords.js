import PatientRecordsView, { StatRow } from "./PatientRecordsView";

function HealthRecords() {
  return (
    <PatientRecordsView
      title="Health Records"
      subtitle="Every prescription written for you, with what the pharmacy, lab and insurer added to it. Read live from the ledger."
      show={["medicines", "lab", "claim"]}
      emptyTitle="No records yet"
      emptyText="Records appear here once a doctor you have granted access to writes a prescription for you."
      summary={(records) => (
        <StatRow
          items={[
            { label: "Prescriptions", value: records.length, accent: true },
            { label: "Medicines dispensed", value: records.filter((r) => r.dispensed).length },
            { label: "Lab reports", value: records.filter((r) => r.labReported).length },
          ]}
        />
      )}
    />
  );
}

export default HealthRecords;
