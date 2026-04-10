import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Triage from "./pages/Triage";
import PatientDetail from "./pages/PatientDetail";
import Audit from "./pages/Audit";
import MainLayout from "./layouts/MainLayout";

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Private><MainLayout><Dashboard/></MainLayout></Private>} />
        <Route path="/patients" element={<Private><MainLayout><Patients/></MainLayout></Private>} />
        <Route path="/triage" element={<Private><MainLayout><Triage/></MainLayout></Private>} />
        <Route path="/patient/:id" element={<Private><MainLayout><PatientDetail/></MainLayout></Private>} />
        <Route path="/audit" element={<Private><MainLayout><Audit/></MainLayout></Private>} />

      </Routes>
    </BrowserRouter>
  );
}