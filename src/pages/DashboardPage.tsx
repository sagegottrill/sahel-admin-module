import { Navigate } from 'react-router-dom';

/** Canonical GovTech clearance demo lives on `/admin-dashboard`. */
export default function DashboardPage() {
  return <Navigate to="/admin-dashboard" replace />;
}
