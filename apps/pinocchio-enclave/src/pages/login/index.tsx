import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getEntropy, getPublicKey } from "@/lib/api";
import { useStorageContext } from "@/contexts/storage";
import { faceTec } from "./utils";

export default function Login() {
  const navigate = useNavigate();
  const { setEntropy, entropy } = useStorageContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If already logged in, redirect to backTo or /wallet
    if (entropy) {
      navigate(searchParams.get("backTo") || "/wallet");
    }
  }, []);

  // Get the FaceTec SDK initials
  useEffect(() => {
    getPublicKey().then((publicKey) => {
      faceTec.init(publicKey, (errorMessage) => {
        if (errorMessage) {
          window.alert(errorMessage);
        }
        faceTec.onLivenessCheckClick((status, token, errorMessage) => {
          if (status && token) {
            getEntropy(token).then((data) => {
              // storage.set("entropy", data.entropy);
              // storage.set("userId", data.faceSignUserId);
              setEntropy(data.entropy);

              // Redirect to backTo parameter or default to /wallet
              const backTo = searchParams.get("backTo") || "/wallet";
              navigate(backTo);
            });
          } else {
            window.alert(errorMessage || "Liveness check failed");
          }
        });
      });
    });
  }, []);

  return <div>Login</div>;
}
