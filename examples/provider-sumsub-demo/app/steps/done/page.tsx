"use client";

import Button from "@/app/components/button";
import { useCurrent } from "@/app/lib/current";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Done() {
  const {
    current: { application },
  } = useCurrent();
  const { push } = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (application?.redirectUri) {
        push(application.redirectUri);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [push, application]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <h2 className="font-bold text-2xl">Congratulations, you&apos;ve completed the process!</h2>
      <Button onClick={() => (application?.redirectUri ? push(application.redirectUri) : null)}>
        You can now continue back to the app
      </Button>
      or you will be automatically redirected in 5 seconds.
    </div>
  );
}
