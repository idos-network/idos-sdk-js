import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useKeyStorageContext } from "@/providers/key.provider";

export default function ProtectedLayout() {
  const { isKeyAvailable } = useKeyStorageContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isKeyAvailable) {
      const params = new URLSearchParams({ redirect: location.pathname });
      navigate(`/login?${params}`, { replace: true });
    }
  }, [isKeyAvailable, navigate, location.pathname]);

  if (!isKeyAvailable) return null;
  return <Outlet />;
}
