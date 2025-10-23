import { Button } from "@heroui/react";
import { useDisconnect } from "@reown/appkit/react";
import { useWalletStore } from "@/app/stores/wallet";
import { useNearWallet } from "@/near.provider";
import stellarKit from "@/stellar.config";

export default function DisconnectWallet() {
  const { disconnect: disconnectEvm } = useDisconnect();
  const near = useNearWallet();
  const { resetWallet, walletType } = useWalletStore();

  return (
    <Button
      color="danger"
      onPress={async () => {
        if (walletType === "stellar") await stellarKit.disconnect();
        if (near.selector.isSignedIn()) {
          const wallet = await near.selector.wallet();
          await wallet.signOut();
        }
        disconnectEvm();
        resetWallet();
        localStorage.removeItem("idOS-signer-address");
        localStorage.removeItem("idOS-signer-public-key");
      }}
    >
      Disconnect
    </Button>
  );
}
