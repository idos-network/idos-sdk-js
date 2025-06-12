import { useWalletStore } from "@/app/stores/wallet";
import { useNearWallet } from "@/near.provider";
import { Button } from "@heroui/react";
import { useDisconnect } from "@reown/appkit/react";

export default function DisconnectWallet() {
  const { disconnect: disconnectEvm } = useDisconnect();
  const near = useNearWallet();
  const { resetWallet } = useWalletStore();

  return (
    <Button
      color="danger"
      onPress={async () => {
        const wallet = await near.selector.wallet();
        await wallet.signOut();
        disconnectEvm();
        resetWallet();
      }}
    >
      Disconnect
    </Button>
  );
}
