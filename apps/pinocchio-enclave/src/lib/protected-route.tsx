import { Navigate, Outlet, useLocation } from "react-router";
import { useStorageContext } from "@/contexts/storage";

export default function ProtectedRoute() {
  const { entropy } = useStorageContext();
  const location = useLocation();

  // If not authenticated (no mnemonic), redirect to login with backTo parameter
  if (!entropy) {
    return <Navigate to={`/login?backTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}
