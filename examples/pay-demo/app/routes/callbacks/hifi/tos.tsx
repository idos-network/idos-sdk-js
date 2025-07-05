import { useEffect } from "react";
import { useSearchParams } from "react-router";

export default function Callback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    window.parent?.postMessage(
      {
        type: "hifi-tos-done",
        signedAgreementId: searchParams.get("signedAgreementId"),
      },
      "*",
    );
  }, []);

  return <div>Processing TOS...</div>;
}
