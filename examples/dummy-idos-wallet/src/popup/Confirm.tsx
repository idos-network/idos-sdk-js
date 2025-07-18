import { type JSX, useEffect, useState } from "react";

export default function Confirm(): JSX.Element {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters to get credential request details
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get("requestId");
    const message = urlParams.get("message");

    setRequestId(requestId);
    setMessage(message);
  }, []);

  const sendResponse = async (result: boolean) => {
    await chrome.runtime.sendMessage({
      type: "IDOS_POPUP_RESPONSE",
      data: {
        requestId,
        result,
      },
    });

    // Close the popup
    window.close();
  };

  return (
    <div
      id="my-ext"
      className="container"
      data-theme="light"
      style={{
        width: "100%",
        height: "100%",
        minWidth: "100%",
        minHeight: "100%",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxSizing: "border-box",
      }}
    >
      <h3>🔐 idOS Confirmation Request</h3>
      <p>Website requesting your confirmation</p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <strong>Request ID:</strong> {requestId || "N/A"}
        </div>

        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
          }}
        >
          <strong>Message:</strong> {message}
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() => sendResponse(false)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => sendResponse(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
