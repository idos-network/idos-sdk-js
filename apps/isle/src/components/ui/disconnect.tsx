import { useDisconnect } from "wagmi";
import { Button } from "./button";

export function DisconnectButton() {
  const { disconnect, isPending } = useDisconnect();
  return (
    <Button px={4} py={3} borderRadius="md" onClick={() => disconnect()} loading={isPending}>
      Disconnect
    </Button>
  );
}
