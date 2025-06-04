import { useWalletStore } from "@/app/stores/wallet";
import { Button } from "@heroui/react";
import { useDisconnect } from "@reown/appkit/react";

export default function DisconnectWallet() {
  const { disconnect: disconnectEvm } = useDisconnect();
  const { resetWallet } = useWalletStore();

  return (
    <Button
      color="danger"
      onPress={() => {
        disconnectEvm();
        resetWallet();
      }}
    >
      Disconnect
    </Button>
  );
}
