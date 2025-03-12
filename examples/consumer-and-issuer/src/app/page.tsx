"use client";

import { createCredential, createIDOSUserProfile } from "@/app/actions";
import { useEthersSigner } from "@/wagmi.config";
import { Button } from "@heroui/react";
import { createIsleController } from "@idos-network/controllers";
import type { DelegatedWriteGrantSignatureRequest } from "@idos-network/core";
import type { IsleStatus } from "@idos-network/core";
import {
  createIssuerConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
} from "@idos-network/issuer-sdk-js/client";
import { goTry } from "go-try";
import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

export default function Home() {
  const isleRef = useRef<ReturnType<typeof createIsleController> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [signature, setSignature] = useState<string | null>(null);
  const [writeGrant, setWriteGrant] = useState<DelegatedWriteGrantSignatureRequest | null>(null);
  const signer = useEthersSigner();

  const requestPermission = () => {
    const isle = isleRef.current;
    invariant(isle, "idOS Isle is not initialized");

    isle.requestPermission({
      consumer: {
        meta: {
          url: "https://idos.network",
          name: "Integrated Consumer",
          logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
        },
        consumerPublicKey: "B809Hj90w6pY2J1fW3B8Cr26tOf4Lxbmy2yNy1XQYnY=",
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
  };

  // Initialize isle controller
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = createIsleController({
      container: container.id,
      enclaveOptions: {
        container: "#idOS-enclave",
        url: "https://enclave.playground.idos.network",
      },
      credentialRequirements: {
        acceptedIssuers: [
          {
            meta: {
              url: "https://idos.network",
              name: "ACME Bank",
              logo: "https://avatars.githubusercontent.com/u/4081301?v=4",
            },
            authPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          },
        ],
        integratedConsumers: [
          {
            meta: {
              url: "https://idos.network",
              name: "ACME Bank",
              logo: "https://avatars.githubusercontent.com/u/4081301?v=4",
            },
            consumerPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          },
          {
            meta: {
              url: "https://idos.network",
              name: "Integrated Consumer",
              logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
            },
            consumerPublicKey: "B809Hj90w6pY2J1fW3B8Cr26tOf4Lxbmy2yNy1XQYnY=",
          },
        ],
        acceptedCredentialType: "KYC DATA",
      },
    });

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = darkModeMediaQuery.matches ? "dark" : "light";

    if (isleRef.current) isleRef.current?.send("update", { theme: currentTheme });

    const themeChangeHandler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";

      if (isleRef.current) isleRef.current.send("update", { theme: newTheme });
    };

    darkModeMediaQuery.addEventListener("change", themeChangeHandler);

    return () => {
      darkModeMediaQuery.removeEventListener("change", themeChangeHandler);
    };
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!isleRef.current) return;

    const isle = isleRef.current;

    isle.on("connect-wallet", async () => {
      await isle.connect();
    });

    isle.on("revoke-permission", async ({ data }) => {
      await isle.revokePermission(data.id);
    });

    isle.on("create-profile", async () => {
      const [error] = await goTry(async () => {
        const userId = crypto.randomUUID();

        const { userEncryptionPublicKey } = await getUserEncryptionPublicKey(userId, {
          container: "#idOS-enclave",
          url: "https://enclave.playground.idos.network",
        });

        const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
        const signature = await signMessageAsync({ message });

        isle.send("update-create-profile-status", {
          status: "pending",
        });

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

        isle.send("update-create-profile-status", {
          status: "success",
        });

        isle.toggleAnimation({
          expanded: false,
        });

        setTimeout(() => {
          isle.send("update", {
            status: "not-verified",
          });
          isle.toggleAnimation({
            expanded: true,
            noDismiss: true,
          });
        }, 5_000);
      });

      if (error) {
        console.error(error);
        isle.send("update-create-profile-status", {
          status: "error",
        });
      }
    });

    isle.on("view-credential-details", async ({ data }) => {
      isle.send("update-view-credential-details-status", {
        status: "pending",
      });

      try {
        const credential = await isle.viewCredentialDetails(data.id);
        isle.send("update-view-credential-details-status", {
          status: "success",
          credential,
        });
      } catch (error) {
        isle.send("update-view-credential-details-status", {
          status: "error",
          error: error as Error,
        });
      }
    });
  }, [address, signMessageAsync]);

  useEffect(() => {
    if (!isleRef.current || !writeGrant || !signature || !signer) return;

    const isle = isleRef.current;

    isle.on("verify-identity", async () => {
      const config = await createIssuerConfig({
        nodeUrl: "https://nodes.playground.idos.network",
        signer,
      });

      const userProfile = await getUserProfile(config);

      const [error] = await goTry(() =>
        createCredential(
          userProfile.id,
          userProfile.recipient_encryption_public_key,
          writeGrant.owner_wallet_identifier,
          writeGrant.grantee_wallet_identifier,
          writeGrant.issuer_public_key,
          writeGrant.id,
          writeGrant.access_grant_timelock,
          writeGrant.not_usable_before,
          writeGrant.not_usable_after,
          signature,
        ),
      );

      if (error) {
        console.error(error);
      }

      isle.send("update", {
        status: "pending-verification",
      });
      isle.toggleAnimation({
        expanded: false,
      });
    });
  }, [writeGrant, signature, signer]);

  useEffect(() => {
    if (!isleRef.current) return;

    const isle = isleRef.current;

    isle.on("updated", async ({ data }: { data: { status?: IsleStatus } }) => {
      switch (data.status) {
        case "not-verified": {
          isle.toggleAnimation({
            expanded: true,
            noDismiss: true,
          });
          const result = await isle.requestDelegatedWriteGrant({
            consumer: {
              consumerPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
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

        default:
          break;
      }
    });
  }, []);

  return (
    <div className="container relative mx-auto h-screen w-full">
      <div
        ref={containerRef}
        id="idOS-isle"
        className="absolute top-0 right-0 h-[800px] w-[380px]"
      />
      <div
        id="idos-root"
        className="invisible fixed top-0 left-0 z-[10000] flex aspect-square h-full w-full flex-col items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-in [&:has(#idOS-enclave.visible)]:visible [&:has(#idOS-enclave.visible)]:opacity-100"
      >
        <div
          id="idOS-enclave"
          className="absolute top-[50%] left-[50%] z-[2] h-fit w-[200px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg bg-neutral-950"
        />
      </div>
      <Button onPress={requestPermission}>Request Permission</Button>
    </div>
  );
}
