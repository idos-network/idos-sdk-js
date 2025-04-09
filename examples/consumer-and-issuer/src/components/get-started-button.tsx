import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import Link from "next/link";

export function GetStartedButton({ title = "Get started now" }: { title?: string }) {
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  if (isConnected) {
    return (
      <Button as={Link} href="/onboarding" color="primary" size="lg">
        {title}
      </Button>
    );
  }

  return (
    <Button
      color="default"
      size="lg"
      onPress={() => {
        open();
      }}
    >
      {title}
    </Button>
  );
}
