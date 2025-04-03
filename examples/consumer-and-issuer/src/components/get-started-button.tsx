import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { injected, useAccount, useConnect } from "wagmi";

export function GetStartedButton({ title = "Get started now" }: { title?: string }) {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const router = useRouter();

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
      onPress={async () => {
        await connectAsync({
          connector: injected(),
        });
        router.replace("/onboarding");
      }}
    >
      {title}
    </Button>
  );
}
