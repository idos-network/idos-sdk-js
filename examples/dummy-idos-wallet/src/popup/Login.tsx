import { type JSX, useEffect, useState } from "react";

export default function Popup(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("Connected");
  const [address, setAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [node, setNode] = useState<string>("");
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    chrome.runtime.sendMessage({
      type: "IDOS_POPUP_CONFIG",
      data: {
        requestId: crypto.randomUUID(),
      },
    });

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.type === "IDOS_POPUP_CONFIG_RESPONSE") {
        console.log("🔑 popup config recieved:", request);
        setAddress(request.data.address);
        setNetwork(request.data.network);
        setNode(request.data.node);
        setStatus(request.data.status);
        setUser(request.data.user);
        setLoading(false);
      }
      sendResponse({ success: true });
    });
  }, []);

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div id="my-ext" data-theme="light" className="container">
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-2xl">🔑 idOS dummy Wallet</h3>

        <p>Welcome to the idOS dummy wallet!</p>

        <p className="font-bold·text-lg·text-red-500">
          Your wallet has no profile yet, please create a new one, you can do it by choosing one of
          providers below:
        </p>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            style={{
              padding: "12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            Kraken
          </button>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Ready for idOS operations
        </div>
      </div>
    </div>
  );
}
