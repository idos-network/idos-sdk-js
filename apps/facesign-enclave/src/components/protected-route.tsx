import { Navigate, Outlet, useLocation } from "react-router";
import { useStorageContext } from "@/lib/storage";

export function ProtectedRoute() {
  const { entropy } = useStorageContext();
  const location = useLocation();

  // If not authenticated (no address), redirect to login with backTo parameter
  if (!entropy) {
    return <Navigate to={`/login?backTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}
