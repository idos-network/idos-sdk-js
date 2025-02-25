"use client";

import { createIsle } from "@idos-network/idos-sdk";
import { useEffect, useRef } from "react";

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsle> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = createIsle({
      container: container.id,
      knownIssuers: [
        {
          url: "https://issuer.idos.network",
          name: "idOS Issuer",
          logo: "https://issuer.idos.network/logo.png",
          authPublicKey: "b1115801ea37364102d0ecddd355c0465293af6efb5f7391c6b4b8065475af4e",
          credentialType: ["PASSPORTING_DEMO"],
        },
      ],
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
