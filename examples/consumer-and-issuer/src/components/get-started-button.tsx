import { useWalletController } from "@/wallet.provider";
import { Button } from "@heroui/react";
import Link from "next/link";
import { WalletSelector } from "./wallet-selector";

export function GetStartedButton({ title = "Get started now" }: { title?: string }) {
  const { isConnected } = useWalletController();

  if (isConnected) {
    return (
      <Button as={Link} href="/onboarding" color="primary" size="lg">
        {title}
      </Button>
    );
  }

  return <WalletSelector />;
}
