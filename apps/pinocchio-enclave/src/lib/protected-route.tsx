import { Navigate, Outlet, useLocation } from "react-router";
import { useKeyStorageContext } from "@/contexts/key";

export default function ProtectedRoute() {
  const { isKeyAvailable } = useKeyStorageContext();
  const location = useLocation();

  // If not authenticated (no mnemonic), redirect to login with backTo parameter
  if (!isKeyAvailable) {
    return <Navigate to={`/login?backTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}
