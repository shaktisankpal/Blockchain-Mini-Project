import PatientRecordsView, { StatRow } from "./PatientRecordsView";
import { formatMoney } from "../../common/ui";

function LabRecords() {
  return (
    <PatientRecordsView
      title="Lab Records"
      subtitle="Lab tests your doctors ordered and the reports the lab added."
      show={["lab"]}
      emptyIcon="beaker"
      emptyTitle="No lab tests yet"
      emptyText="Lab tests show up here once a doctor orders them."
      summary={(records) => {
        const tests = records.flatMap((r) => r.labTests);
        return (
          <StatRow
            items={[
              { label: "Tests ordered", value: tests.length },
              { label: "Reports received", value: tests.filter((t) => t.report).length, accent: true },
              { label: "Total billed", value: formatMoney(records.reduce((sum, r) => sum + (r.labBill || 0), 0)) },
            ]}
          />
        );
      }}
    />
  );
}

export default LabRecords;
