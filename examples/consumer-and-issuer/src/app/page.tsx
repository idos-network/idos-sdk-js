"use client";

import { IframeEnclave, createIsle, type idOSCredential } from "@idos-network/idos-sdk";
import { goTry } from "go-try";
import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { createIDOSUserProfile } from "./actions";

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
      credentialMatcher: (cred: idOSCredential) => {
        const publicNotes = JSON.parse(cred.public_notes ?? "{}");
        return publicNotes.status === "pending";
      },
      appWalletIdentifier: "",
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
      <div className="flex h-full w-full items-center justify-center p-6">
        <div
          id="idOS-enclave"
          className="h-auto w-[200px] overflow-hidden rounded-lg bg-neutral-950"
        />
      </div>
    </div>
  );
}
