"use client";

import { createCredential, createIDOSUserProfile } from "@/actions";
import { useIsle } from "@/isle.provider";
import { useEthersSigner } from "@/wagmi.config";
import { Button, Spinner } from "@heroui/react";
import type { DelegatedWriteGrantSignatureRequest } from "@idos-network/core";
import type { IsleStatus } from "@idos-network/core";
import {
  createIssuerConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
} from "@idos-network/issuer-sdk-js/client";
import { goTry } from "go-try";
import { CheckCircle, CreditCard, User } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";
import Stepper, { type Step } from "./stepper";

const steps: Step[] = [
  // {
  //   id: "welcome",
  //   icon: <PiHandWavingBold className="h-4 w-4" />,
  //   title: "WELCOME TO NEO-BANK",
  //   description: "In order to sign up for Neo-bank you need to have a matching KYC/AML credential in idOS. user can either create a new profile or link an existing one."
  // },
  {
    id: "profile-creation",
    icon: <User className="h-4 w-4" />,
    title: "Profile Creation",
    description:
      "User needs to sign a message to confirm that they own the wallet address. and pick authentication method",
  },
  {
    id: "permissions",
    icon: <CreditCard className="h-4 w-4" />,
    title: "Permissions",
    description:
      "User needs to grant permissions to Neobank to write a credential to their idos profile",
  },
  {
    id: "verification",
    icon: <CheckCircle className="h-4 w-4" />,
    title: "Verification",
    description: "User needs to verify their identity by providing a valid KYC/AML credential",
  },
  {
    id: "pending-verification",
    icon: <FaSpinner className="h-4 w-4" />,
    title: "Pending Verification",
    description: "User's data is being processed. Please be patient or just refresh the screen.",
  },
  {
    id: "verified",
    icon: <FaCheckCircle className="h-4 w-4" />,
    title: "Verified",
    description: "User has been successfully onboarded!",
  },
];

export function Onboarding() {
  const { isle } = useIsle();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [signature, setSignature] = useState<string | null>(null);
  const [writeGrant, setWriteGrant] = useState<DelegatedWriteGrantSignatureRequest | null>(null);
  const signer = useEthersSigner();
  const [status, setStatus] = useState<IsleStatus | null>(null);
  const [requesting, startRequesting] = useTransition();

  const requestPermission = () => {
    invariant(isle, "`idOS Isle` is not initialized");

    isle.toggleAnimation({
      expanded: true,
    });

    startRequesting(async () => {
      await isle.requestPermission({
        consumer: {
          meta: {
            url: "https://idos.network",
            name: "ACME Card Provider",
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
      setStatus(data.status ?? null);
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
  }, [isle]);

  const statusIndexSrc = {
    "no-profile": 0,
    "not-verified": 1,
    // TODO: handle verification status
    "pending-verification": 3,
    verified: 4,
  };

  const index = statusIndexSrc[status as keyof typeof statusIndexSrc] || 0;

  return (
    <div className="container relative mx-auto flex h-screen w-full flex-col place-content-center items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with NeoBank</h1>

      <Stepper activeIndex={index} steps={steps} />
      {status === "verified" ? (
        <div className="mt-5 flex flex-col items-center gap-2">
          <h3 className="font-bold text-2xl">You have been successfully onboarded!</h3>
          <p className="text-center text-lg">
            Enjoy unprecedented spending power with our exclusive high-limit <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text font-bold text-transparent dark:from-amber-200 dark:to-yellow-400">
              $1,000,000
            </span>
            credit card.
          </p>
          <p className="text-center text-lg">Ready to Elevate Your Financial Journey?</p>
          <Button size="lg" color="primary" onPress={requestPermission} isLoading={requesting}>
            Claim now
          </Button>
        </div>
      ) : null}
    </div>
  );
}
