"use client";

import { createIsle, type idOSCredential } from "@idos-network/idos-sdk";
import { useEffect, useRef } from "react";

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsle> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = createIsle({
      container: container.id,
      credentialMatcher: (cred: idOSCredential) => {
        const publicNotes = JSON.parse(cred.public_notes ?? "{}");
        return publicNotes.status === "pending";
      },
      appWalletIdentifier: "",
    });

    isleRef.current.on("connect-wallet", async () => {
      await isleRef.current?.connect();
    });

    isleRef.current.on("create-profile", async () => {});

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, []);

  return (
    <div>
      <div ref={containerRef} id="idOS-isle" className="h-[800px]" />
    </div>
  );
}
