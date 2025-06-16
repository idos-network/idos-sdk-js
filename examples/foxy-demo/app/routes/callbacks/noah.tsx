import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    window.parent?.postMessage(
      {
        type: "noah-done",
      },
      "*",
    );
  }, []);

  return <div>Loading...</div>;
}
