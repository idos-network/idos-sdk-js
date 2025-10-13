import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getEntropy, getPublicKey } from "@/lib/api";
import { storage } from "@/lib/storage";
import { faceTec } from "./utils";

export default function Login() {
  const navigate = useNavigate();

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
              storage.set("entropy", data.entropy);
              storage.set("userId", data.faceSignUserId);
              navigate("/wallet");
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
