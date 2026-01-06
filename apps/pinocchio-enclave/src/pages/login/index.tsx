import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useKeyStorageContext } from "@/contexts/key";
import { getEntropy } from "@/lib/api";
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
    faceTec.init((errorMessage, token) => {
      if (errorMessage) {
        return navigate("/error", { state: { message: errorMessage } });
      }

      if (token) {
        getEntropy(token).then((data) => {
          // Redirection will be done in useEffect above
          setMnemonic(data.entropy);
        });
      } else {
        console.error("Unexpected state: neither errorMessage nor token is set");
      }
    });
  }, []);

  return <div>Login</div>;
}
