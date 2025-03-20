"use client";

import { Button, useDisclosure } from "@heroui/react";
import type { IsleStatus } from "@idos-network/core";
import { getUserEncryptionPublicKey } from "@idos-network/issuer-sdk-js/client";
import { goTry } from "go-try";
import { CreditCard, User } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import { createIDOSUserProfile } from "@/actions";
import { useIsle } from "@/isle.provider";

import { Card } from "./card";
import { KYCJourney } from "./kyc-journey";
import { type Step, Stepper } from "./stepper";

const steps: Step[] = [
  {
    icon: <User className="h-4 w-4" />,
    title: "Profile Creation",
    description:
      "User needs to sign a message to confirm that they own the wallet address. and pick authentication method",
  },
  {
    icon: <User className="h-4 w-4" />,
    title: "Verification",
    description: "User needs to be verified",
  },
  {
    icon: <FaSpinner className="h-4 w-4" />,
    title: "Pending Verification",
    description: "User's data is being processed. Please be patient or just refresh the screen.",
  },
  {
    icon: <CreditCard className="h-4 w-4" />,
    title: "Permissions",
    description:
      "User needs to grant permissions to Neobank to write a credential to their idos profile",
  },
  {
    icon: <FaCheckCircle className="h-4 w-4" />,
    title: "Claim your Acme card",
    description:
      "You can now claim your exclusive high-limit credit card and start your premium banking journey.",
  },
];

export function Onboarding() {
  const { isle } = useIsle();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [status, setStatus] = useState<IsleStatus | null>(null);
  const [requesting, startRequesting] = useTransition();
  const kycDisclosure = useDisclosure();

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

  const handleKYCJourneySuccess = (data: { token: string }) => {
    kycDisclosure.onClose();

    console.log({ data });

    isle?.send("update", {
      status: "pending-verification",
    });
  };

  const handleKYCJourneyError = (error: unknown) => {
    kycDisclosure.onClose();
  };

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

        setTimeout(() => {
          isle.send("update", {
            status: "not-verified",
          });
          isle.toggleAnimation({
            expanded: true,
            noDismiss: true,
          });
        }, 2_000);
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
    if (!isle) return;

    isle.on("verify-identity", async () => {
      kycDisclosure.onOpen();
    });
  }, [kycDisclosure, isle]);

  useEffect(() => {
    if (!isle) return;

    isle.on("updated", async ({ data }: { data: { status?: IsleStatus } }) => {
      setStatus(data.status ?? null);

      isle.toggleAnimation({
        expanded: true,
      });
    });
  }, [isle]);

  const statusIndexSrc = {
    "no-profile": 0,
    "not-verified": 1,
    "pending-verification": 2,
    verified: 3,
  };

  const index = statusIndexSrc[status as keyof typeof statusIndexSrc] || 0;

  return (
    <div className="container relative mr-auto flex h-screen w-[60%] flex-col place-content-center items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with NeoBank</h1>

      <Stepper activeIndex={index} steps={steps} />
      {status === "verified" ? (
        <div className="mt-5 flex w-full flex-col items-center gap-2">
          <h3 className="font-bold text-2xl">You have been successfully onboarded!</h3>
          <div className="flex w-full items-center gap-4">
            <Card />
            <div className="flex flex-col gap-3">
              <p className="text-center text-lg">
                Enjoy unprecedented spend your crypto and enjoy our exclusive crypto rewards in
                partnership with AcmeCard <br />
              </p>
              <p className="text-center text-lg">Ready to Elevate Your Financial Journey?</p>
              <Button size="lg" color="primary" onPress={requestPermission} isLoading={requesting}>
                Claim your Acme Card now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {kycDisclosure.isOpen ? (
        <KYCJourney onSuccess={handleKYCJourneySuccess} onError={handleKYCJourneyError} />
      ) : null}
    </div>
  );
}
