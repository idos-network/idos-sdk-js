"use client";

import { IframeEnclave, createIsle } from "@idos-network/idos-sdk";
import { goTry } from "go-try";
import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { createIDOSUserProfile } from "@/actions";

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsle> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

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

    isleRef.current.on("create-profile", async () => {
      // Initializes the idOS enclave.This is needed to discover the user's encryption public key.
      const enclave = new IframeEnclave({
        container: "#idOS-enclave",
        url: "https://enclave.playground.idos.network",
        mode: "new",
      });

      await enclave.load();
      const userId = crypto.randomUUID();
      const { userEncryptionPublicKey } = await enclave.discoverUserEncryptionPublicKey(userId);
      console.log(userEncryptionPublicKey);
      const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
      const signature = await signMessageAsync({ message });

      isleRef.current?.send("update-create-profile-status", {
        status: "pending",
      });

      // Creates the idOS user profile.
      const [error, user] = await goTry(() =>
        createIDOSUserProfile({
          userId,
          recipientEncryptionPublicKey: userEncryptionPublicKey,
          wallet: {
            address: address as string,
            type: "EVM",
            message,
            signature,
            publicKey: signature,
          },
        }),
      );

      if (error) {
        console.error(error);
        isleRef.current?.send("update-create-profile-status", {
          status: "error",
        });
        return;
      }

      isleRef.current?.send("update-create-profile-status", {
        status: "success",
      });
    });

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, [address, signMessageAsync]);

  return (
    <div>
      <div ref={containerRef} id="idOS-isle" className="h-[800px]" />
      <div
        id="idos-root"
        className="invisible fixed top-0 left-0 z-[10000] flex aspect-square h-full w-full flex-col items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-in [&:has(#idOS-enclave.visible)]:visible [&:has(#idOS-enclave.visible)]:opacity-100"
      >
        <div
          id="idOS-enclave"
          className="absolute top-[50%] left-[50%] z-[2] h-fit w-[200px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg bg-neutral-950"
        />
      </div>
    </div>
  );
}
