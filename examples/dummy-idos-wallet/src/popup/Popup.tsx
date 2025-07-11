import { keyDerivation } from "@idos-network/utils/encryption";
import { type JSX, useEffect, useState } from "react";

interface CredentialRequest {
  requestId: string;
  level: string;
  origin: string;
  url: string;
}

export default function Popup(): JSX.Element {
  const [key, setKey] = useState<string | null>(null);
  const [credentialRequest, setCredentialRequest] = useState<CredentialRequest | null>(null);

  useEffect(() => {
    // Parse URL parameters to get credential request details
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get("requestId");
    const level = urlParams.get("level");
    const origin = urlParams.get("origin");
    const url = urlParams.get("url");

    if (requestId && level && origin && url) {
      setCredentialRequest({
        requestId,
        level,
        origin: decodeURIComponent(origin),
        url: decodeURIComponent(url),
      });
    }
  }, []);

  const handleDeriveKey = async () => {
    const derivedKey = await keyDerivation("Test", "3921a0e4-2ab2-463b-a22b-21c8758df46f");
    setKey(JSON.stringify(derivedKey));
  };

  const handleApproveCredentials = () => {
    if (!credentialRequest) return;

    // Send approval message to background script
    chrome.runtime.sendMessage({
      type: "IDOS_CREDENTIALS_RESPONSE_FROM_POPUP",
      data: {
        requestId: credentialRequest.requestId,
        credentials: {
          level: credentialRequest.level,
          data: {
            name: "John Doe",
            email: "john@example.com",
            age: 25,
            verified: true,
          },
        },
      },
    });

    // Close the popup
    // window.close();
  };

  const handleRejectCredentials = () => {
    if (!credentialRequest) return;

    // Send rejection message to background script
    chrome.runtime.sendMessage({
      type: "IDOS_CREDENTIALS_RESPONSE_FROM_POPUP",
      data: {
        requestId: credentialRequest.requestId,
        error: "User rejected the credential request",
      },
    });

    // Close the popup
    // window.close();
  };

  if (credentialRequest) {
    return (
      <div id="my-ext" className="container" data-theme="light">
        <h3>🔐 Credential Request</h3>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h4 className="card-title">Website requesting credentials</h4>
            <p>
              <strong>Origin:</strong> {credentialRequest.origin}
            </p>
            <p>
              <strong>Level:</strong> {credentialRequest.level}
            </p>
            <p>
              <strong>URL:</strong> {credentialRequest.url}
            </p>

            <div className="card-actions mt-4 justify-end">
              <button type="button" className="btn btn-error" onClick={handleRejectCredentials}>
                Reject
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApproveCredentials}>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="my-ext" className="container" data-theme="light">
      <h3>🔑 idOS Wallet</h3>
      <p>Test wallet popup with idOS client:</p>
      <button type="button" className="btn btn-outline" onClick={handleDeriveKey}>
        Derive Key
      </button>
      {key && (
        <div className="mt-4">
          <h4>Derived Key:</h4>
          <pre className="rounded bg-base-200 p-2 text-xs">{key}</pre>
        </div>
      )}
    </div>
  );
}
