import { useNearWalletSelector } from "@/app/hooks/useNearConnection";
import { useWalletStore } from "@/app/stores/wallet";
import { Button } from "@heroui/react";
import { useDisconnect } from "@reown/appkit/react";

export default function DisconnectWallet() {
  const { disconnect: disconnectEvm } = useDisconnect();
  const { resetWallet, walletType } = useWalletStore();
  const { disconnect: disconnectNear } = useNearWalletSelector();

  const disconnect = () => {
    if (walletType === "near") {
      disconnectNear();
    } else {
      disconnectEvm();
    }
  };

  return (
    <Button
      color="danger"
      onPress={() => {
        disconnect();
        resetWallet();
      }}
    >
      Disconnect
    </Button>
  );
}
