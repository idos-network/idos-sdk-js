"use client";

import Button from "@/app/components/Button";
import { useCurrent } from "@/app/lib/current";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Done() {
  const {
    current: { application },
  } = useCurrent();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (application && application.redirectUri) {
        router.push(application.redirectUri);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex items-center justify-center h-full flex-col gap-2">
      <h2 className="text-2xl font-bold">Congratulations, you&apos;ve completed the process!</h2>
      <Button
        onClick={() =>
          application && application.redirectUri ? router.push(application.redirectUri) : null
        }
      >
        You can now continue back to the app
      </Button>
      or you will be automatically redirected in 5 seconds.
    </div>
  );
}
