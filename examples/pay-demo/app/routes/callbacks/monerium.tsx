import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    window.parent?.postMessage(
      {
        type: "monerium-callback",
        code: new URLSearchParams(window.location.search).get("code"),
      },
      "*",
    );
  }, []);

  return <div>Loading...</div>;
}
