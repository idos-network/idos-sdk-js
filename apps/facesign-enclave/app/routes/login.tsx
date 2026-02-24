import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { getEntropy } from "@/lib/api";
import { faceTec } from "@/lib/facetec";
import { useKeyStorageContext } from "@/providers/key.provider";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setMnemonic, isKeyAvailable } = useKeyStorageContext();
  const initialized = useRef(false);

  const redirect = searchParams.get("redirect") ?? "/wallet";

  useEffect(() => {
    if (isKeyAvailable) {
      navigate(redirect);
    }
  }, [isKeyAvailable, redirect, navigate]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    faceTec.init((errorMessage, attestationToken, newUserConfirmationToken) => {
      if (errorMessage) {
        const params = new URLSearchParams({ message: errorMessage, redirect });
        navigate(`/error?${params}`);
        return;
      }

      if (attestationToken) {
        getEntropy(attestationToken).then((data) => {
          setMnemonic(data.entropy);
        });
      } else if (newUserConfirmationToken) {
        const params = new URLSearchParams({
          message: "No FaceSign profile found",
          token: newUserConfirmationToken,
          redirect,
        });
        navigate(`/error?${params}`);
      } else {
        console.error("Unexpected state: neither errorMessage nor token is set");
      }
    });
  }, []);

  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <Spinner className="size-8" />
    </div>
  );
}