import { getAddress, isInstalled, signMessage } from "@gemwallet/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { message } from "@/lib/constants";

function Connector() {
  const [accountId, setAccountId] = useState("");

  const handleConnect = async () => {
    try {
      const installed = await isInstalled();

      if (!installed?.result?.isInstalled) {
        throw new Error("GemWallet is not installed");
      }

      const { result } = await getAddress();

      setAccountId(result?.address ?? "");
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const { result } = await signMessage(message);
      const signature = result?.signedMessage;
      console.log(signature);
    } catch (error) {
      console.error("Signing message failed:", error);
    }
  };

  const handleDisconnect = async () => {
    setAccountId("");
  };

  if (!accountId) {
    return (
      <Button variant="secondary" size="xl" onClick={handleConnect}>
        Connect with XRP
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center font-bold text-2xl">Sign a message</h1>
      <p className="text-center text-muted-foreground text-sm">
        Sign this message with your wallet to prove you own it
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-center text-muted-foreground text-sm">Connected as:</p>
        <p className="text-center text-muted-foreground text-sm">{accountId}</p>
      </div>
      <Button onClick={handleSignMessage}>Sign a message</Button>
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </div>
  );
}

export function XRPLConnector() {
  return <Connector />;
}
