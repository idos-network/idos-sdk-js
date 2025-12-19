import { getAddress, getPublicKey, isInstalled, signMessage } from "@gemwallet/api";
import { Button } from "@/components/ui/button";
import { message } from "@/lib/constants";
import { closeWindowIfPopup, sendToParent } from "@/lib/utils";
import { useStore } from "@/state";

function Connector() {
  const accountId = useStore((state) => state.accountId);
  const setWallet = useStore((state) => state.setWallet);
  const setAccountId = useStore((state) => state.setAccountId);

  const handleConnect = async () => {
    try {
      const installed = await isInstalled();

      if (!installed?.result?.isInstalled) {
        throw new Error("GemWallet is not installed");
      }

      const { result } = await getAddress();

      if (result?.address) {
        setAccountId(result.address);
        setWallet("xrpl");
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const { result } = await signMessage(message);
      const signature = result?.signedMessage;

      if (!accountId) {
        throw new Error("`accountId` is not set");
      }

      if (!signature) {
        throw new Error("`signature` is not set");
      }

      const { result: publicKeyResult } = await getPublicKey();
      const publicKey = publicKeyResult?.publicKey;

      if (!publicKey) {
        throw new Error("`publicKey` is not set");
      }

      sendToParent({
        type: "idOS_WALLET_CONNECTOR:MESSAGE_SIGNED",
        payload: {
          address: accountId,
          signature,
          public_key: [publicKey],
          message,
        },
      });

      await handleDisconnect();
      closeWindowIfPopup();
    } catch (error) {
      console.error("Signing message failed:", error);
    }
  };

  const handleDisconnect = async () => {
    setAccountId(null);
    setWallet(null);
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
        <p className="text-center text-muted-foreground text-sm">
          {accountId.slice(0, 20)}...{accountId.slice(-4)}
        </p>
      </div>
      <Button onClick={handleSignMessage}>Sign a message</Button>
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </div>
  );
}

export function XRPLConnector() {
  return <Connector />;
}
