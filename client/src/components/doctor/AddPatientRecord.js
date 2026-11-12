import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import paitientService from "../../services/patientService";
import Icon from "../../common/icons";
import { Field, Notice, Page, errorMessage, inputClass } from "../../common/ui";

const emptyMedicine = () => ({ name: "", dose: "" });
const emptyTest = () => ({ name: "" });

// Removable rows of inputs (medicines / lab tests).
function Rows({ title, icon, rows, setRows, empty, fields, addLabel }) {
  const update = (i, key, value) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name={icon} className="h-4 w-4 text-lime" /> {title}
        </div>
        <button type="button" className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => setRows([...rows, empty()])}>
          + {addLabel}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">None added.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              {fields.map(([key, placeholder, width]) => (
                <input
                  key={key}
                  className={`${inputClass} ${width}`}
                  placeholder={placeholder}
                  required
                  value={row[key]}
                  onChange={(e) => update(i, key, e.target.value)}
                />
              ))}
              <button
                type="button"
                aria-label="Remove"
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/5 hover:text-red-300"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPatientRecords() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(params.get("patientId") || "");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [labTests, setLabTests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    paitientService
      .getPatientAccessList()
      .then((res) => {
        const list = (res.data.accessMemberDetails || []).filter((p) => p.patientId);
        setPatients(list);
        if (!params.get("patientId") && list.length === 1) setPatientId(String(list[0].patientId));
      })
      .catch((e) => setError(errorMessage(e, "Could not load your patients")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const meds = medicines.filter((m) => m.name.trim());
      const tests = labTests.filter((t) => t.name.trim());
      await paitientService.postPrescription({ patientId, args: [diagnosis.trim(), meds, tests, patientId] });
      navigate(`/patient-records?patient=${patientId}`);
    } catch (err) {
      setError(errorMessage(err, "Could not save the prescription"));
      setBusy(false);
    }
  };

  return (
    <Page
      narrow
      label="Doctor portal"
      title="New Prescription"
      subtitle="The prescription is written to the shared ledger and becomes visible to the patient and to the pharmacy, lab and insurer they granted access."
      actions={<Link to="/patient-records" className="btn-outline">Back to patients</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="card grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Patient">
            <select className={inputClass} required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="" disabled>
                {patients.length ? "Select a patient" : "No patients have granted you access"}
              </option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.name} · ID {p.patientId}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Diagnosis">
              <textarea className={`${inputClass} min-h-[90px]`} required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Viral fever with mild dehydration" />
            </Field>
          </div>
        </div>

        <Rows
          title="Medicines"
          icon="pill"
          addLabel="Medicine"
          rows={medicines}
          setRows={setMedicines}
          empty={emptyMedicine}
          fields={[["name", "Medicine", "flex-1"], ["dose", "Dose, e.g. 500mg twice daily", "flex-1"]]}
        />
        <Rows
          title="Lab tests"
          icon="beaker"
          addLabel="Lab test"
          rows={labTests}
          setRows={setLabTests}
          empty={emptyTest}
          fields={[["name", "Test, e.g. Complete blood count", "flex-1"]]}
        />

        <Notice>{error}</Notice>
        <div className="flex justify-end">
          <button className="btn-lime" disabled={busy || !patientId}>
            {busy ? "Writing to ledger…" : "Prescribe"}
          </button>
        </div>
      </form>
    </Page>
  );
}

export default AddPatientRecords;
