import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useKeyStorageContext } from "@/contexts/key";
import { getEntropy, getPublicKey } from "@/lib/api";
import { faceTec } from "./utils";

export default function Login() {
  const navigate = useNavigate();
  const { setMnemonic, isKeyAvailable } = useKeyStorageContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If already logged in, redirect to backTo or /wallet
    if (isKeyAvailable) {
      navigate(searchParams.get("backTo") || "/wallet");
    }
  }, [isKeyAvailable]);

  // Get the FaceTec SDK initials
  useEffect(() => {
    getPublicKey().then((publicKey) => {
      faceTec.init(publicKey, (errorMessage) => {
        if (errorMessage) {
          navigate("/error", { state: { message: errorMessage } });
        }
        faceTec.onLivenessCheckClick((status, token, errorMessage) => {
          if (status && token) {
            getEntropy(token).then((data) => {
              // Redirection will be done in useEffect above
              setMnemonic(data.entropy);
            });
          } else {
            navigate("/error", { state: { message: errorMessage || "Liveness check failed" } });
          }
        });
      });
    });
  }, []);

  return <div>Login</div>;
}
