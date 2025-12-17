import type { ISupportedWallet as StellarSupportedWallet } from "@creit.tech/stellar-wallets-kit";
import {
  FREIGHTER_ID,
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import { Button } from "@/components/ui/button";
import "@near-wallet-selector/modal-ui/styles.css";
import { StrKey } from "@stellar/stellar-base";
import { useState } from "react";
import { message } from "@/lib/constants";

const stellarKit: StellarWalletsKit = new StellarWalletsKit({
  network: import.meta.env.DEV ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule()],
});

async function derivePublicKey(address: string) {
  if (!address) {
    throw new Error("Address is required");
  }
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
}

function Connector() {
  const [accountId, setAccountId] = useState("");

  const handleConnect = async () => {
    try {
      await stellarKit.openModal({
        onWalletSelected: async (option: StellarSupportedWallet) => {
          stellarKit.setWallet(option.id);
          const { address } = await stellarKit.getAddress();
          setAccountId(address);
        },
      });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const messageBase64 = Buffer.from(message).toString("base64");
      const result = await stellarKit.signMessage(messageBase64);
      let signedMessageInBase64 = Buffer.from(result.signedMessage, "base64");

      if (signedMessageInBase64.length > 64) {
        signedMessageInBase64 = Buffer.from(signedMessageInBase64.toString(), "base64");
      }
      const signature = signedMessageInBase64.toString("hex");
      console.log(signature);
    } catch (error) {
      console.error("Signing message failed:", error);
    }
  };

  const handleDisconnect = async () => {
    await stellarKit.disconnect();
    setAccountId("");
  };

  if (!accountId) {
    return (
      <Button variant="secondary" size="xl" onClick={handleConnect}>
        Connect with Stellar
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

export function StellarConnector() {
  return <Connector />;
}
