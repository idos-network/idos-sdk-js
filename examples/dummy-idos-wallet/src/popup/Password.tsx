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
  const [password, setPassword] = useState<string | null>(null);
  const [allowedEncryptionStores, setAllowedEncryptionStores] = useState<string[] | null>(null);
  const [selectedEncryptionStore, setSelectedEncryptionStore] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters to get credential request details
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get("requestId");
    const userId = urlParams.get("userId") ?? crypto.randomUUID();
    const expectedUserEncryptionPublicKey = urlParams.get("expectedUserEncryptionPublicKey");
    const allowedEncryptionStores = urlParams.get("allowedEncryptionStores");

    setRequestId(requestId);
    setUserId(userId);
    setExpectedUserEncryptionPublicKey(expectedUserEncryptionPublicKey);
    setAllowedEncryptionStores(
      allowedEncryptionStores ? JSON.parse(allowedEncryptionStores) : null,
    );
  }, []);

  useEffect(() => {
    if (allowedEncryptionStores && allowedEncryptionStores.length === 1) {
      setSelectedEncryptionStore(allowedEncryptionStores[0]);
    }
  }, [allowedEncryptionStores]);

  useEffect(() => {
    if (selectedEncryptionStore === "mpc") {
      setPassword(null);
      handleDeriveKey();
    }
  }, [selectedEncryptionStore]);

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
          encryptionPasswordStore: selectedEncryptionStore,
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

        {allowedEncryptionStores &&
          allowedEncryptionStores.length > 1 &&
          !selectedEncryptionStore && (
            <div>
              <strong>Choose your authentication method:</strong>
              <div className="flex w-full flex-row justify-center gap-2 p-10">
                {allowedEncryptionStores?.map((method) => (
                  <button
                    type="button"
                    className={`btn btn-soft w-1/2 ${method === "mpc" ? "btn-primary" : "btn-secondary"}`}
                    key={method}
                    onClick={() => setSelectedEncryptionStore(method)}
                  >
                    {method[0].toLocaleUpperCase() + method.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

        {selectedEncryptionStore === "user" && (
          <div
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
          </div>
        )}
      </div>

      {selectedEncryptionStore === "user" && (
        <div className="flex w-full flex-row justify-end gap-2 border-gray-200 border-t-2 pt-2">
          <button type="button" onClick={handleCancel} className="btn btn-soft btn-secondary">
            Reject
          </button>
          <button type="button" onClick={handleDeriveKey} className="btn btn-soft btn-primary">
            OK
          </button>
        </div>
      )}
    </div>
  );
}
