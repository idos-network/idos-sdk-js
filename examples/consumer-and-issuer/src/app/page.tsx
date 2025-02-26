"use client";

import { createIsleController } from "@idos-network/controllers";
import { IframeEnclave } from "@idos-network/idos-sdk";
import { createIssuerConfig, requestDWGSignature } from "@idos-network/issuer-sdk-js/client";
import { goTry } from "go-try";
import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { createIDOSUserProfile } from "@/app/actions";
import { useEthersSigner } from "@/wagmi.config";

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsleController> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const signer = useEthersSigner();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = createIsleController({
      container: container.id,
      knownIssuers: [
        {
          url: "https://issuer.idos.network",
          name: "idOS Issuer",
          logo: "https://issuer.idos.network/logo.png",
          authPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          credentialType: ["PASSPORTING_DEMO"],
        },
      ],
    });

    isleRef.current.on("connect-wallet", async () => {
      await isleRef.current?.connect();
    });

    isleRef.current.on("request-dwg", async () => {
      // @todo: move this to the isle controller?
      if (!signer) return;

      const config = await createIssuerConfig({
        nodeUrl: "https://nodes.playground.idos.network",
        signer,
      });

      const issuerPublicKey = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "";
      const currentTimestamp = Date.now();
      const currentDate = new Date(currentTimestamp);
      const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);
      const delegatedWriteGrant = {
        id: crypto.randomUUID(),
        owner_wallet_identifier: address as string,
        grantee_wallet_identifier: issuerPublicKey,
        issuer_public_key: issuerPublicKey,
        access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
      };
      const message: string = await requestDWGSignature(config, delegatedWriteGrant);
      isleRef.current?.send("update-create-dwg-status", {
        status: "pending",
      });

      const [error, signature] = await goTry(async () => signMessageAsync({ message }));

      if (error) {
        isleRef.current?.send("update-create-dwg-status", {
          status: "error",
        });

        return;
      }

      isleRef.current?.send("update-create-dwg-status", {
        status: "success",
      });
    });

    isleRef.current.on("create-profile", async () => {
      const [error] = await goTry(async () => {
        // Initializes the idOS enclave.This is needed to discover the user's encryption public key.
        const enclave = new IframeEnclave({
          container: "#idOS-enclave",
          url: "https://enclave.playground.idos.network",
          mode: "new",
        });

        await enclave.load();
        const userId = crypto.randomUUID();
        const { userEncryptionPublicKey } = await enclave.discoverUserEncryptionPublicKey(userId);
        const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
        const signature = await signMessageAsync({ message });

        isleRef.current?.send("update-create-profile-status", {
          status: "pending",
        });
        // Creates the idOS user profile.
        await createIDOSUserProfile({
          userId,
          recipientEncryptionPublicKey: userEncryptionPublicKey,
          wallet: {
            address: address as string,
            type: "EVM",
            message,
            signature,
            publicKey: signature,
          },
        });

        isleRef.current?.send("update-create-profile-status", {
          status: "success",
        });
      });

      if (error) {
        isleRef.current?.send("update-create-profile-status", {
          status: "error",
        });
      }
    });

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, [address, signMessageAsync, signer]);

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
