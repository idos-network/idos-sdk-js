"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import Link from "next/link";
import { Button } from "./ui/button";

export function ConnectWallet() {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  if (isConnected) {
    return (
      <Button asChild className="h-12 w-[200px] rounded-full">
        <Link href="/dashboard">Continue to Dashboard</Link>
      </Button>
    );
  }

  return (
    <Button className="h-12 w-[200px] rounded-full" onClick={() => open()}>
      Connect Wallet
    </Button>
  );
}
