import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./container/home";
import Navbar from "./container/navbar";
import Page404 from "./container/page404";
import Login from "./components/login/login";
import Register from "./components/login/register";
import RegisterByAdmin from "./components/login/registerByAdmin";
import Dashboard from "./container/dashboard";
import Profile from "./container/profile";
import RoleAccess from "./common/roleAccess";
import SelectDoctor from "./components/patient/selectDoctor";
import SelectChemist from "./components/patient/selectChemist";
import SelectLab from "./components/patient/SelectLab";
import SelectInsuranceCompany from "./components/patient/SelectInsuranceCompany";
import HealthRecords from "./components/patient/HealthRecords";
import PharmacyRecords from "./components/patient/PharmacyRecords";
import LabRecords from "./components/patient/LabRecords";
import InsuranceRecords from "./components/patient/InsuranceRecords";
import PatientsWorkspace from "./components/doctor/PaitirntRecords";
import AddPatientRecords from "./components/doctor/AddPatientRecord";
import Logout from "./container/logout";

const PROVIDERS = ["doctor", "pharmacy", "lab", "insurance"];

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        <Route element={<RoleAccess roles={["Admin", "patient", ...PROVIDERS]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route element={<RoleAccess roles={["Admin"]} />}>
          <Route path="/add-user" element={<RegisterByAdmin />} />
        </Route>

        {/* Patient */}
        <Route element={<RoleAccess roles={["patient"]} />}>
          <Route path="/select-doctor" element={<SelectDoctor />} />
          <Route path="/select-pharmacy" element={<SelectChemist />} />
          <Route path="/select-lab" element={<SelectLab />} />
          <Route path="/select-insurance-company" element={<SelectInsuranceCompany />} />
          <Route path="/health-records" element={<HealthRecords />} />
          <Route path="/pharmacy-records" element={<PharmacyRecords />} />
          <Route path="/lab-records" element={<LabRecords />} />
          <Route path="/insurance-records" element={<InsuranceRecords />} />
        </Route>

        {/* Doctor, pharmacy, lab, insurance: one workspace, actions depend on the role */}
        <Route element={<RoleAccess roles={PROVIDERS} />}>
          <Route path="/patient-records" element={<PatientsWorkspace />} />
          {/* Old per-role URLs now open the workspace */}
          <Route path="/generate-bill" element={<Navigate to="/patient-records" replace />} />
          <Route path="/customer-list" element={<Navigate to="/patient-records" replace />} />
          <Route path="/add-reports" element={<Navigate to="/patient-records" replace />} />
          <Route path="/paitient-records" element={<Navigate to="/patient-records" replace />} />
          <Route path="/latest-requests" element={<Navigate to="/patient-records" replace />} />
        </Route>

        <Route element={<RoleAccess roles={["doctor"]} />}>
          <Route path="/add-patient-records" element={<AddPatientRecords />} />
        </Route>

        <Route path="*" element={<Page404 />} />
      </Routes>
    </>
  );
}

export default App;
