"use client";

import { Code } from "@heroui/react";
import { createIsleController } from "@idos-network/controllers";
import type { DelegatedWriteGrantSignatureRequest } from "@idos-network/core";
import { IframeEnclave } from "@idos-network/idos-sdk";
import { goTry } from "go-try";
import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { createIDOSUserProfile } from "@/app/actions";

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsleController> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [signature, setSignature] = useState<string | null>(null);
  const [writeGrant, setWriteGrant] = useState<DelegatedWriteGrantSignatureRequest | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = createIsleController({
      container: container.id,
      consumers: [],
      acceptedIssuers: [
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

    isleRef.current.on("revoke-permission", async ({ data }) => {
      await isleRef.current?.revokePermission(data.id);
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

    isleRef.current.on("verify-identity", async (data) => {
      // @todo: this should redirect the user to the issuer's knownKYC provider
    });

    isleRef.current.on("updated", async ({ data }) => {
      switch (data.status) {
        case "not-verified": {
          const result = await isleRef.current?.requestDelegatedWriteGrant({
            grantee: {
              granteePublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
              meta: {
                url: "https://idos.network",
                name: "idOS",
                logo: "https://avatars.githubusercontent.com/u/143606397?s=48&v=4",
              },
            },
            KYCPermissions: [
              "Name and last name",
              "Gender",
              "Country and city of residence",
              "Place and date of birth",
              "ID Document",
              "Liveness check (No pictures)",
            ],
          });

          if (result) {
            const { signature, writeGrant } = result;
            setSignature(signature);
            setWriteGrant(writeGrant);
          }
          break;
        }

        case "verified": {
          // const result = await isleRef.current?.requestAccessGrant({
          //   grantee: {
          //     granteePublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          //     meta: {
          //       url: "https://idos.network",
          //       name: "idOS",
          //       logo: "https://avatars.githubusercontent.com/u/143606397?s=48&v=4",
          //     },
          //   },
          //   KYCPermissions: [
          //     "Name and last name",
          //     "Gender",
          //     "Country and city of residence",
          //     "Place and date of birth",
          //     "ID Document",
          //     "Liveness check (No pictures)",
          //   ],
          // });
          break;
        }

        default:
          break;
      }
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

      {signature && writeGrant ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <Code>
            <pre>{JSON.stringify({ signature, writeGrant }, null, 2)}</pre>
          </Code>
        </div>
      ) : null}
    </div>
  );
}
