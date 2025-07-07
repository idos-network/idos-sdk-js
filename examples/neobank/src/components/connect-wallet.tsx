"use client";

import { useAppKit } from "@reown/appkit/react";
import { Button } from "./ui/button";

export function ConnectWallet() {
  const { open } = useAppKit();

  return (
    <Button className="h-12 w-[200px] rounded-full" onClick={() => open()}>
      Connect Wallet
    </Button>
  );
}
