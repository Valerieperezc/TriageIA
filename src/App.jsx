import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLoadingScreen } from "./components/AppLoadingScreen";
import { useAuth } from "./hooks/useAuth";
import { getHomePathForRole } from "./utils/roleConfig";

const Login = lazy(() => import("./pages/Login"));
const RoleHome = lazy(() => import("./pages/RoleHome"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const Triage = lazy(() => import("./pages/Triage"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const Audit = lazy(() => import("./pages/Audit"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivateAppLayout = lazy(() => import("./layouts/PrivateAppLayout"));

function RouteLoader() {
  return <AppLoadingScreen message="Cargando módulo…" />;
}

function Private({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <AppLoadingScreen message="Verificando sesión…" />;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <AppLoadingScreen message="Verificando sesión…" />;
  }
  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />

          <Route
            path="/"
            element={
              <Private>
                <PrivateAppLayout>
                  <RoleHome />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Private>
                <PrivateAppLayout>
                  <Dashboard />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/patients"
            element={
              <Private>
                <PrivateAppLayout>
                  <Patients />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/triage"
            element={
              <Private allowedRoles={["admin", "recepcion", "enfermeria"]}>
                <PrivateAppLayout>
                  <Triage />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/patient/:id"
            element={
              <Private>
                <PrivateAppLayout>
                  <PatientDetail />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/audit"
            element={
              <Private allowedRoles={["admin"]}>
                <PrivateAppLayout>
                  <Audit />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Private allowedRoles={["admin"]}>
                <PrivateAppLayout>
                  <AdminUsers />
                </PrivateAppLayout>
              </Private>
            }
          />
          <Route
            path="/settings"
            element={
              <Private>
                <PrivateAppLayout>
                  <Settings />
                </PrivateAppLayout>
              </Private>
            }
          />

          <Route
            path="*"
            element={
              <Private>
                <PrivateAppLayout>
                  <NotFound />
                </PrivateAppLayout>
              </Private>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}