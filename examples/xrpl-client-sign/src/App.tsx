import * as GemWallet from "@gemwallet/api";
import * as Hex from "@stablelib/hex";
import * as Utf8 from "@stablelib/utf8";
import { useEffect, useState } from "react";
import { Client, type CredentialAccept } from "xrpl";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const isInstalled = await GemWallet.isInstalled();
        if (isInstalled.result.isInstalled) {
          const addressResult = await GemWallet.getAddress();
          if (addressResult.result?.address) {
            setWalletAddress(addressResult.result.address);
          }
        }
      } catch (error) {
        console.log("Wallet not connected");
        console.log(error);
      }
    };

    checkWalletConnection();
  }, []);

  const handleWalletConnection = async () => {
    if (walletAddress) {
      // Disconnect wallet
      setWalletAddress(null);
      return;
    }

    try {
      setIsWalletConnecting(true);
      setError(null);

      // Check if GemWallet is installed
      const isInstalled = await GemWallet.isInstalled();
      if (!isInstalled.result.isInstalled) {
        setError("GemWallet is not installed. Please install it from the Chrome Web Store.");
        return;
      }

      // Get wallet address
      const addressResult = await GemWallet.getAddress();
      if (addressResult.result?.address) {
        setWalletAddress(addressResult.result.address);
      } else {
        setError("Failed to get wallet address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const handleCreateCredential = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      if (!walletAddress) {
        setError("Please connect your wallet first");
        return;
      }

      // Create XRPL client
      const client = new Client("wss://s.devnet.rippletest.net:51233");
      await client.connect();

      try {
        // Create a simple payment transaction as an example
        const baseTransaction = {
          TransactionType: "CredentialAccept" as const,
          Issuer: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
          Account: walletAddress,
          CredentialType: Hex.encode(Utf8.encode("KYC")),
        };
        console.log(baseTransaction);
        // Autofill the transaction
        const transaction = await client.autofill(baseTransaction as CredentialAccept);
        console.log(transaction);

        const info = await client.request({
          command: "feature",
          features: true,
        });

        console.log(info);

        const signature = await GemWallet.signTransaction({ transaction });
        console.log(signature);

        // Extend the transaction with the signature
        const signedTransaction = {
          ...transaction,
          TxnSignature: signature.result?.signature || "",
        };

        const resp = await client.submitAndWait(signedTransaction);
        console.log(resp);
      } finally {
        await client.disconnect();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🚀 XRPL Credential Creator</h1>
        <p className="description">
          Click the button below to create a time-locked credential copy on the XRPL blockchain
        </p>

        {/* Wallet Connection Section */}
        <div className="wallet-section">
          <button
            type="button"
            className={`wallet-button ${isWalletConnecting ? "disabled" : ""}`}
            onClick={handleWalletConnection}
            disabled={isWalletConnecting}
          >
            {isWalletConnecting
              ? "Connecting..."
              : walletAddress
                ? "Disconnect Wallet"
                : "Connect Wallet"}
          </button>

          {walletAddress && (
            <div className="wallet-info">
              <span className="wallet-label">Connected Wallet:</span>
              <span className="wallet-address">{walletAddress}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`button ${isLoading ? "disabled" : ""}`}
          onClick={handleCreateCredential}
          disabled={isLoading}
        >
          {isLoading ? "Creating Credential..." : "Create XRPL Credential"}
        </button>

        {isLoading && <div className="loading">Creating credential on XRPL blockchain...</div>}

        {error && <div className="result error">❌ Error: {error}</div>}

        {result && (
          <div className="result success">
            ✅ Credential created successfully!
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
