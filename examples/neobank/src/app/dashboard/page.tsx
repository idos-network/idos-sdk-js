"use client";

import { useDisconnect } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { disconnect } = useDisconnect();
  const router = useRouter();
  return (
    <div className="container mx-auto grid h-svh place-content-center p-5">
      <Button
        size="lg"
        className="rounded-full"
        onClick={async () => {
          await disconnect();
          router.replace("/");
        }}
      >
        Disconnect
      </Button>
    </div>
  );
}
