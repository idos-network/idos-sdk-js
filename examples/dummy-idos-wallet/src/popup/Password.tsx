import { type JSX, useEffect, useState } from "react";

export default function Popup(): JSX.Element {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expectedUserEncryptionPublicKey, setExpectedUserEncryptionPublicKey] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>("Heslo123!");

  useEffect(() => {
    // Parse URL parameters to get credential request details
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get("requestId");
    const userId = urlParams.get("userId") ?? crypto.randomUUID();
    const expectedUserEncryptionPublicKey = urlParams.get("expectedUserEncryptionPublicKey");

    setRequestId(requestId);
    setUserId(userId);
    setExpectedUserEncryptionPublicKey(expectedUserEncryptionPublicKey);
  }, []);

  const handleDeriveKey = async () => {
    // TODO: Check if the password matches the expected user encryption public key

    await chrome.runtime.sendMessage({
      type: "IDOS_POPUP_RESPONSE",
      data: {
        requestId,
        result: password,
      },
    });

    // Close the popup
    window.close();
  };

  const handleCancel = () => {
    // Send rejection message to background script
    chrome.runtime.sendMessage({
      type: "IDOS_POPUP_RESPONSE",
      data: {
        requestId,
        error: "User rejected the credential request",
      },
    });

    // Close the popup
    window.close();
  };

  return (
    <div id="my-ext" className="container" data-theme="light">
      <h3>🔐 idOS credential request</h3>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h4 className="card-title">Website requesting your password to decrypt the credential</h4>
          <p>
            <input type="password" value={password ?? ""} onChange={(e) => setPassword(e.target.value)} className="input input-bordered w-full max-w-xs" />
          </p>

          <div className="card-actions mt-4 justify-end">
            <button type="button" className="btn btn-error" onClick={handleCancel}>
              Reject
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDeriveKey}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
