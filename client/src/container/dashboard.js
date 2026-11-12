import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import Icon from "../common/icons";

const DASHBOARDS = {
  patient: {
    label: "Patient portal",
    title: "Manage Your Health Records",
    apps: [
      { name: "Select Doctor", desc: "Grant or revoke a doctor's access to your records.", icon: "heart", link: "/select-doctor" },
      { name: "Select Pharmacy", desc: "Choose the pharmacy that dispenses your medicines.", icon: "pill", link: "/select-pharmacy" },
      { name: "Select Lab", desc: "Choose the lab that runs your tests.", icon: "beaker", link: "/select-lab" },
      { name: "Select Insurance Company", desc: "Allow your insurer to review claims.", icon: "umbrella", link: "/select-insurance-company" },
      { name: "Health Records", desc: "Prescriptions written for you, straight from the ledger.", icon: "doc", link: "/health-records" },
      { name: "Pharmacy Records", desc: "Medicines dispensed and their bills.", icon: "receipt", link: "/pharmacy-records" },
      { name: "Lab Records", desc: "Lab test reports and bills.", icon: "pulse", link: "/lab-records" },
      { name: "Insurance Records", desc: "Your claims and their status.", icon: "shield", link: "/insurance-records" },
    ],
  },
  doctor: {
    label: "Doctor portal",
    title: "Your Patients",
    apps: [{ name: "Patient Records", desc: "Patients who granted you access: history and new prescriptions.", icon: "users", link: "/patient-records" }],
  },
  pharmacy: {
    label: "Pharmacy portal",
    title: "Dispense & Bill",
    apps: [{ name: "Patient Records", desc: "Prescribed medicines for patients who granted you access.", icon: "pill", link: "/patient-records" }],
  },
  lab: {
    label: "Lab portal",
    title: "Tests & Reports",
    apps: [{ name: "Patient Records", desc: "Lab tests ordered for patients who granted you access.", icon: "beaker", link: "/patient-records" }],
  },
  insurance: {
    label: "Insurance portal",
    title: "Claim Requests",
    apps: [{ name: "Patient Records", desc: "Review claims from patients who granted you access.", icon: "umbrella", link: "/patient-records" }],
  },
  Admin: {
    label: "Admin console",
    title: "Network Administration",
    apps: [{ name: "Add User", desc: "Register doctors, pharmacies, labs and insurers on the ledger.", icon: "userPlus", link: "/add-user" }],
  },
};

function Dashboard() {
  const navigate = useNavigate();
  const role = authService.getRole();
  const board = DASHBOARDS[role];

  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-ink">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
        <span className="label">{board ? board.label : "Dashboard"}</span>
        <h1 className="mt-4 font-display text-4xl font-medium text-white sm:text-5xl">
          {board ? board.title : "Select your service"}
        </h1>
        <p className="mt-3 text-neutral-400">
          {authService.getUserName() ? (
            <>Welcome back, <span className="text-white">{authService.getUserName()}</span>. Select a service to continue.</>
          ) : (
            "Select a service to continue."
          )}
        </p>

        {!board ? (
          <div className="card mt-12 p-10 text-center text-neutral-400">
            Please sign in to see your services.
            <div className="mt-6">
              <button className="btn-lime" onClick={() => navigate("/login")}>Sign In</button>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {board.apps.map((app) => (
              <button
                key={app.name}
                onClick={() => navigate(app.link)}
                className="card group flex flex-col p-6 text-left transition hover:-translate-y-0.5 hover:border-lime/40 hover:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-lime/40"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-lime transition group-hover:bg-lime group-hover:text-black">
                    <Icon name={app.icon} className="h-5 w-5" />
                  </span>
                  <Icon name="arrow" className="h-4 w-4 -translate-x-1 text-neutral-600 transition group-hover:translate-x-0 group-hover:text-lime" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{app.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{app.desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
