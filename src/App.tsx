// Top-level routing. Authenticated routes live under <Layout/>, which itself
// guards against unauthenticated access and redirects to /login.
import { Navigate, Route, Routes } from 'react-router-dom';
import { currentUser, hasRole, useStore } from './db/store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Marketplace } from './pages/Marketplace';
import { DatasetDetail } from './pages/DatasetDetail';
import { Publish } from './pages/Publish';
import { Governance } from './pages/Governance';
import { DataDepartment } from './pages/DataDepartment';
import { Regulatory } from './pages/Regulatory';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { MyRequests } from './pages/MyRequests';
import type { Role } from './types';

/** Route guard: requires the active user to hold a given role. */
function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const store = useStore();
  const user = currentUser(store);
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(user, role)) return <Navigate to="/marketplace" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/marketplace" replace />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/dataset/:id" element={<DatasetDetail />} />
        <Route path="/requests" element={<MyRequests />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/regulatory" element={<Regulatory />} />
        <Route
          path="/publish"
          element={
            <RequireRole role="Provider">
              <Publish />
            </RequireRole>
          }
        />
        <Route
          path="/governance"
          element={
            <RequireRole role="Governance">
              <Governance />
            </RequireRole>
          }
        />
        <Route
          path="/data-department"
          element={
            <RequireRole role="DataDept">
              <DataDepartment />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role="Admin">
              <Admin />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/marketplace" replace />} />
    </Routes>
  );
}
