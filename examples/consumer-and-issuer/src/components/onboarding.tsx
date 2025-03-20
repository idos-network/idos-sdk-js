"use client";

import { Button, Spinner } from "@heroui/react";
import { type DelegatedWriteGrantSignatureRequest, requestDAGSignature } from "@idos-network/core";
import type { IsleStatus } from "@idos-network/core";
import {
  createIssuerConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
} from "@idos-network/issuer-sdk-js/client";
import { goTry } from "go-try";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import { createCredential, createIDOSUserProfile } from "@/actions";
import { useIsle } from "@/isle.provider";
import { useEthersSigner } from "@/wagmi.config";
import {
  createCredentialCopy,
  getCredentialContentSha256Hash,
} from "@idos-network/consumer-sdk-js/client";

export function Onboarding() {
  const { isle } = useIsle();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [signature, setSignature] = useState<string | null>(null);
  const [writeGrant, setWriteGrant] = useState<DelegatedWriteGrantSignatureRequest | null>(null);
  const signer = useEthersSigner();
  const [status, setStatus] = useState<IsleStatus | null>(null);

  const requestPermission = () => {
    invariant(isle, "`idOS Isle` is not initialized");

    isle.toggleAnimation({
      expanded: true,
    });

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

  // Set up event handlers
  useEffect(() => {
    if (!isle) return;

    isle.on("connect-wallet", async () => {
      await isle.connect();
    });

    isle.on("revoke-permission", async ({ data }: { data: { id: string } }) => {
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

    isle.on("view-credential-details", async ({ data }: { data: { id: string } }) => {
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

    isle.on("share-credential", async ({ data }: { data: { id: string } }) => {
      // const signature = await isle.shareCredential(data.id);
      const kwilClient = await isle.getKwilClient();

      const consumerSigningPublicKey = process.env.NEXT_PUBLIC_CONSUMER_SIGNING_PUBLIC_KEY;
      const consumerEncryptionPublicKey = process.env.NEXT_PUBLIC_CONSUMER_ENCRYPTION_PUBLIC_KEY;

      invariant(kwilClient, "Kwil client not found");
      // @todo: remove this once we clean previous passporting app (they're using outdated params)
      invariant(consumerSigningPublicKey, "NEXT_PUBLIC_CONSUMER_SIGNING_PUBLIC_KEY is not set");
      invariant(
        consumerEncryptionPublicKey,
        "NEXT_PUBLIC_CONSUMER_ENCRYPTION_PUBLIC_KEY is not set",
      );

      const enclave = await isle.getEnclave();
      invariant(enclave, "Enclave not found");
      const contentHash = await getCredentialContentSha256Hash(
        { kwilClient, decryptCredentialContent: isle.decryptCredentialContent },
        data.id,
      );

      const { id } = await createCredentialCopy(
        // C1.2
        { kwilClient },
        data.id,
        consumerEncryptionPublicKey,
        {
          consumerAddress: consumerSigningPublicKey,
          lockedUntil: 0,
          decryptCredentialContent: isle.decryptCredentialContent,
          encryptCredentialContent: isle.encryptCredentialContent,
        },
      );

      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: consumerSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: 0,
        dag_content_hash: contentHash,
      };
      const [{ message }] = await requestDAGSignature(kwilClient, dag);
      const signature = await signMessageAsync({ message });
      const dagWithSignature = { ...dag, dag_signature: signature };

      // invoke passporting service
      console.log({ dagWithSignature });
    });
  }, [address, signMessageAsync, isle]);

  useEffect(() => {
    if (!isle || !writeGrant || !signature || !signer) return;

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
  }, [writeGrant, signature, signer, isle]);

  useEffect(() => {
    if (!isle) return;

    isle.on("updated", async ({ data }: { data: { status?: IsleStatus } }) => {
      switch (data.status) {
        case "not-verified": {
          isle.toggleAnimation({
            expanded: true,
            noDismiss: true,
          });
          const result = await isle.requestDelegatedWriteGrant({
            consumer: {
              consumerPublicKey: process.env.NEXT_PUBLIC_CONSUMER_PUBLIC_KEY,
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
          setStatus(data.status ?? null);
      }
    });
  }, [isle]);

  return (
    <div className="container relative mx-auto flex h-screen w-full flex-col place-content-center items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with ACME Bank</h1>
      {status === "verified" ? (
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-bold text-2xl">You have been successfully onboarded!</h3>
          <p className="text-center text-lg">
            Enjoy unprecedented spending power with our exclusive high-limit <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text font-bold text-transparent dark:from-amber-200 dark:to-yellow-400">
              $1,000,000
            </span>{" "}
            credit card.
          </p>
          <p className="text-center text-lg">Ready to Elevate Your Financial Journey?</p>
          <Button size="lg" color="primary" onPress={requestPermission}>
            Claim now
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {status === "pending-verification" ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-lg">Your data is now being processed.</p>
              <p className="text-center text-gray-500 text-sm">
                It can take up to 24 hours to verify your data. Please be patient or just refresh
                the screen.
              </p>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      )}
    </div>
  );
}
