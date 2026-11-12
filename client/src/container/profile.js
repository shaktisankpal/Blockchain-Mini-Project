import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import paitientService from "../services/patientService";
import Icon from "../common/icons";
import { Badge, Loading, Notice, Page, errorMessage, formatDate } from "../common/ui";

const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", pharmacy: "Pharmacy", lab: "Lab", insurance: "Insurance", Admin: "Administrator" };
const ORG_ICON = { patient: "user", doctor: "heart", pharmacy: "pill", lab: "beaker", insurance: "umbrella" };

// Account details from MongoDB plus the people linked to this account through access grants (from the ledger).
function Profile() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    paitientService
      .getUserDetails()
      .then((res) => setData(res.data))
      .catch((e) => setError(errorMessage(e, "Could not load your profile")));
  }, []);

  if (error) {
    return (
      <Page label="Account" title="Your Profile">
        <Notice>{error}</Notice>
      </Page>
    );
  }
  if (!data) {
    return (
      <Page label="Account" title="Your Profile">
        <Loading label="Loading your profile…" />
      </Page>
    );
  }

  const user = data.result;
  const linked = data.accessMemberDetails || [];
  const isPatient = user.orgName === "patient";
  const idOf = (m) => m.patientId || m.doctorId || m.pharmacyId || m.labId || m.insuranceId;

  return (
    <Page narrow label="Account" title="Your Profile">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-black">
            <Icon name={ORG_ICON[user.orgName] || "user"} className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <div>
            <div className="font-display text-2xl font-semibold text-white">{user.userName}</div>
            <Badge tone="lime">{ROLE_LABEL[user.orgName] || user.orgName}</Badge>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-neutral-500">User ID</dt>
            <dd className="text-neutral-200">{user.userId}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Member since</dt>
            <dd className="text-neutral-200">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">{isPatient ? "Providers with access" : "Patients"}</dt>
            <dd className="text-neutral-200">{linked.length}</dd>
          </div>
        </dl>
      </div>

      {user.orgName !== "Admin" && (
        <div className="mt-8">
          <h2 className="label mb-4">{isPatient ? "Who can see your records" : "Patients who granted you access"}</h2>
          {linked.length === 0 ? (
            <div className="card p-6 text-sm text-neutral-400">
              {isPatient ? (
                <>
                  Nobody yet. Grant access from <Link className="text-lime underline" to="/select-doctor">Doctors</Link>,{" "}
                  <Link className="text-lime underline" to="/select-pharmacy">Pharmacy</Link>,{" "}
                  <Link className="text-lime underline" to="/select-lab">Labs</Link> or{" "}
                  <Link className="text-lime underline" to="/select-insurance-company">Insurance</Link>.
                </>
              ) : (
                "No patient has granted you access yet."
              )}
            </div>
          ) : (
            <div className="card divide-y divide-white/[0.05]">
              {linked.map((m) => (
                <div key={idOf(m)} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Icon name={ORG_ICON[m.orgName] || "user"} className="h-4 w-4 text-lime" />
                    <span className="text-sm text-white">{m.name}</span>
                  </div>
                  <span className="text-xs capitalize text-neutral-500">
                    {m.orgName || "patient"} · ID {idOf(m)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}

export default Profile;
