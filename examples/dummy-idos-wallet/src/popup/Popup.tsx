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
    <div
      id="my-ext"
      className="container"
      data-theme="light"
      style={{
        width: "450px",
        height: "400px",
        minWidth: "450px",
        minHeight: "400px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxSizing: "border-box",
      }}
    >
      <h3>🔑 idOS dummy Wallet</h3>
      <p>Test wallet popup with idOS client:</p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            padding: "12px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          {user && (
            <>
              <strong>idOS User:</strong> {user}
            </>
          )}
          {!user && (
            <>
              <strong>idOS Status:</strong> {status}
            </>
          )}
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
          }}
        >
          <strong>idOS Node:</strong> {node}
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#ecfdf5",
            borderRadius: "8px",
            border: "1px solid #10b981",
          }}
        >
          <strong>idOS Network:</strong> {network}
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#dbeafe",
            borderRadius: "8px",
            border: "1px solid #3b82f6",
          }}
        >
          <strong>Wallet Address:</strong> {address}
        </div>
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
  );
}
