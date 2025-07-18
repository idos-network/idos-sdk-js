import { keyDerivation } from "@idos-network/utils/encryption";
import { encode } from "@stablelib/base64";
import { type JSX, useEffect, useState } from "react";
import nacl from "tweetnacl";

export default function Popup(): JSX.Element {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expectedUserEncryptionPublicKey, setExpectedUserEncryptionPublicKey] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>("Heslo123!");
  const [allowedAuthMethods, setAllowedAuthMethods] = useState<string[] | null>(null);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters to get credential request details
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get("requestId");
    const userId = urlParams.get("userId") ?? crypto.randomUUID();
    const expectedUserEncryptionPublicKey = urlParams.get("expectedUserEncryptionPublicKey");
    const allowedAuthMethods = urlParams.get("allowedAuthMethods");

    setRequestId(requestId);
    setUserId(userId);
    setExpectedUserEncryptionPublicKey(expectedUserEncryptionPublicKey);
    setAllowedAuthMethods(allowedAuthMethods ? JSON.parse(allowedAuthMethods) : null);
  }, []);

  useEffect(() => {
    if (allowedAuthMethods && allowedAuthMethods.length === 1) {
      setSelectedAuthMethod(allowedAuthMethods[0]);
    }
  }, [allowedAuthMethods]);

  useEffect(() => {
    if (selectedAuthMethod === "mpc") {
      setPassword(null);
      handleDeriveKey();
    }
  }, [selectedAuthMethod]);

  const handleDeriveKey = async () => {
    // TODO: Check if the password matches the expected user encryption public key
    if (password && userId && expectedUserEncryptionPublicKey) {
      const secretKey = await keyDerivation(password, userId);
      const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

      if (encode(keyPair.publicKey) !== expectedUserEncryptionPublicKey) {
        setError("Invalid password.");
        return;
      }
    }

    setError(null);

    await chrome.runtime.sendMessage({
      type: "IDOS_POPUP_RESPONSE",
      data: {
        requestId,
        result: {
          password,
          authMethod: selectedAuthMethod,
        },
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
      <h3>🔐 idOS Credential Request</h3>
      <p>Website requesting your password to decrypt the credential</p>

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
          <strong>User ID:</strong> {userId || "N/A"}
        </div>

        {allowedAuthMethods && allowedAuthMethods.length > 1 && !selectedAuthMethod && <div>
          <strong>Choose your authentication method:</strong>
          <div className="flex flex-row gap-2 p-10 w-full justify-center">
            {allowedAuthMethods?.map((method) => (
              <button
                type="button"
                className={`w-1/2 btn btn-soft ${method === "mpc" ? "btn-primary" : "btn-secondary"}`}
                key={method}
                onClick={() => setSelectedAuthMethod(method)}
              >
                {method[0].toLocaleUpperCase() + method.slice(1)}
              </button>
            ))}
            </div>
          </div>
        }

        {selectedAuthMethod === "password" && <div
          style={{
            padding: "16px",
            backgroundColor: "#dbeafe",
            borderRadius: "8px",
            border: "1px solid #3b82f6",
          }}
        >
          <strong>Password:</strong>
          <input
            type="password"
            value={password ?? ""}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          />
          {error && <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
        </div>}
      </div>

      {selectedAuthMethod === "password" &&
        <div className="flex flex-row gap-2 w-full justify-end border-t-2 pt-2 border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-soft btn-secondary"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleDeriveKey}
            className="btn btn-soft btn-primary"
          >
            OK
          </button>
        </div>
      }
    </div>
  );
}
