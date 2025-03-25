"use client";

import { Button, useDisclosure } from "@heroui/react";
import {
  createCredentialCopy,
  getCredentialContentSha256Hash,
} from "@idos-network/consumer-sdk-js/client";
import { requestDAGMessage } from "@idos-network/core";
import { type IsleStatus, createAttribute, getAttributes, hasProfile } from "@idos-network/core";
import {
  createIssuerConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
} from "@idos-network/issuer-sdk-js/client";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import type { JsonRpcSigner } from "ethers";
import { goTry } from "go-try";
import { CreditCard, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import {
  createCredential,
  createIDOSUserProfile,
  getUserIdFromToken,
  insertDagIntoIdos,
} from "@/actions";
import { useIsle } from "@/isle.provider";
import { useEthersSigner } from "@/wagmi.config";

import { Card } from "./card";
import { KYCJourney } from "./kyc-journey";
import Portfolio from "./portfolio";
import { type Step, Stepper } from "./stepper";

const useFetchIDVStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["idv-status", userId],
    queryFn: (): Promise<{ status: string }> =>
      fetch(`/api/idv-status/${userId}`).then((res) => res.json()),
    select: (data) => data.status,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Keep polling if status is pending
      if (status === "pending") return 5_000;
      // Stop polling if status is approved or rejected
      if (status === "approved" || status === "rejected") return false;
      // Default polling interval
      return 5_000;
    },
    enabled: !!userId,
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the results
  });
};

const useFetchUserData = (signer: JsonRpcSigner | undefined) => {
  return useQuery({
    queryKey: ["user-data"],
    queryFn: async () => {
      if (!signer) throw new Error("Signer is not initialized");

      const config = await createIssuerConfig({
        nodeUrl: "https://nodes.playground.idos.network",
        signer,
      });

      const hasUserProfile = await hasProfile(config.kwilClient, await signer.getAddress());
      if (!hasUserProfile) return null;

      // First get the user profile which handles authentication
      const idOSProfile = await getUserProfile(config);

      // Then get the attributes using the same authenticated session
      const attributes = await getAttributes(config.kwilClient);
      const idvUserId = attributes.find((attribute) => attribute.attribute_key === "idvUserId")
        ?.value as string;

      return {
        hasProfile: hasUserProfile,
        idvUserId,
        idOSProfile,
      };
    },
    enabled: !!signer,
    select: (data) => data ?? { hasProfile: false, idvUserId: undefined, idOSProfile: undefined },
    refetchOnWindowFocus: false,
  });
};

export const useCreateIDVAttribute = () => {
  return useMutation({
    mutationFn: async (data: {
      idvUserId: string;
      signature: string;
      signer: JsonRpcSigner;
      userId: string;
    }) => {
      const { signer } = data;
      const config = await createIssuerConfig({
        nodeUrl: "https://nodes.playground.idos.network",
        signer,
      });
      return createAttribute(config.kwilClient, {
        id: crypto.randomUUID(),
        attribute_key: "idvUserId",
        value: data.idvUserId,
        user_id: data.userId,
      });
    },
  });
};

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
  const [status, setStatus] = useState("");
  const [requesting, startRequesting] = useTransition();
  const kycDisclosure = useDisclosure();
  const signer = useEthersSigner();
  const hasRegisteredDWGHandler = useRef(false);
  const hasStartedDWG = useRef(false);
  const hasRegisteredHandlers = useRef(false);
  const hasRegisteredRevokeHandler = useRef(false);

  const { data: userData, refetch: refetchUserData } = useFetchUserData(signer);
  const { data: idvStatus } = useFetchIDVStatus(userData?.idvUserId);
  const createIDVAttribute = useCreateIDVAttribute();

  // Register revoke-permission handler in its own effect
  useEffect(() => {
    if (!isle) return;
    if (hasRegisteredRevokeHandler.current) return;

    const handleRevokePermission = async ({ data }: { data: { id: string } }) => {
      await isle.revokePermission(data.id);
    };

    isle.on("revoke-permission", handleRevokePermission);
    hasRegisteredRevokeHandler.current = true;

    return () => {
      hasRegisteredRevokeHandler.current = false;
    };
  }, [isle]); // Only depend on isle

  // Register other event handlers
  useEffect(() => {
    if (!isle) return;
    if (hasRegisteredHandlers.current) return;

    const handleCreateProfile = async () => {
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
    };

    const handleViewCredentialDetails = async ({ data }: { data: { id: string } }) => {
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
    };

    const handleUpdated = async ({ data }: { data: { status?: IsleStatus } }) => {
      if (data.status === "not-verified") {
        if (idvStatus === "pending") {
          setStatus("pending-verification");
          isle.send("update", {
            status: "pending-verification",
          });
        }
      }

      if (data.status === "not-verified" && idvStatus === "approved") {
        setStatus("request-permissions");
        isle.toggleAnimation({
          expanded: true,
        });
        return;
      }

      setStatus(String(data.status));
      isle.toggleAnimation({
        expanded: true,
      });
    };

    // Register all handlers
    isle.on("connect-wallet", async () => {
      await isle.connect();
    });

    isle.on("create-profile", handleCreateProfile);
    isle.on("view-credential-details", handleViewCredentialDetails);
    isle.on("verify-identity", async () => {
      kycDisclosure.onOpen();
    });
    isle.on("updated", handleUpdated);
    hasRegisteredHandlers.current = true;

    // Cleanup function
    return () => {
      hasRegisteredHandlers.current = false;
    };
  }, [isle, address, kycDisclosure, idvStatus, signMessageAsync]);

  useEffect(() => {
    if (!isle) return;
    isle.on("share-credential", async ({ data }: { data: { id: string } }) => {
      // const signature = await isle.shareCredential(data.id);
      const kwilClient = await isle.getKwilClient();

      const consumerSigningPublicKey = process.env.NEXT_PUBLIC_CONSUMER_SIGNING_PUBLIC_KEY;
      const consumerEncryptionPublicKey = process.env.NEXT_PUBLIC_CONSUMER_ENCRYPTION_PUBLIC_KEY;

      invariant(kwilClient, "Kwil client not found");
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
      const message: string = await requestDAGMessage(kwilClient, dag);
      const signature = await signMessageAsync({ message });
      const dagWithSignature = { ...dag, dag_signature: signature };

      // inserting dag into idos
      await insertDagIntoIdos(dagWithSignature);
    });
  }, [isle, address, signMessageAsync]);

  const handleCredentialIssuance = useCallback(async () => {
    const [error] = await goTry(async () => {
      // Get fresh data when the handler is called
      const { data: freshUserData } = await refetchUserData();

      invariant(signer, "Signer is not initialized");
      invariant(freshUserData?.hasProfile, "IDOS Profile not found");
      invariant(freshUserData?.idvUserId, "IDV User ID not found");
      invariant(freshUserData?.idOSProfile, "IDOS User not found");

      const response = await isle?.requestDelegatedWriteGrant({
        consumer: {
          consumerPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          meta: {
            url: "https://consumer-and-issuer-demo.vercel.app/",
            name: "NeoBank",
            logo: "https://consumer-and-issuer-demo.vercel.app/static/logo.svg",
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

      if (response) {
        const { signature, writeGrant } = response;

        await createCredential(
          freshUserData.idvUserId,
          freshUserData.idOSProfile.recipient_encryption_public_key,
          writeGrant.owner_wallet_identifier,
          writeGrant.grantee_wallet_identifier,
          writeGrant.issuer_public_key,
          writeGrant.id,
          writeGrant.access_grant_timelock,
          writeGrant.not_usable_before,
          writeGrant.not_usable_after,
          signature,
        );

        isle?.completeVerification();
      }
    });

    if (error) {
      console.error("Error in request-dwg handler:", error);
    }
  }, [isle, refetchUserData, signer]);

  // Register the request-dwg handler in a separate effect
  useEffect(() => {
    if (!isle) return;
    if (!userData?.hasProfile || !userData?.idvUserId || !userData?.idOSProfile) return;
    if (hasRegisteredDWGHandler.current) return;

    isle.on("request-dwg", handleCredentialIssuance);
    hasRegisteredDWGHandler.current = true;

    return () => {
      hasRegisteredDWGHandler.current = false;
    };
  }, [isle, userData, handleCredentialIssuance]);

  useEffect(() => {
    if (!isle) return;

    // Add a guard to prevent running if we're already handling the status
    if (status === "request-permissions") return;

    // Add a guard to prevent unnecessary updates
    if (idvStatus === "pending" && status === "pending-verification") return;
    if (idvStatus === "rejected" && status === "not-verified") return;
    if (idvStatus === "approved" && status === "request-permissions") return;

    if (idvStatus === "approved" && status !== "request-permissions" && !hasStartedDWG.current) {
      console.log("IDV verification approved, starting delegated write grant...");
      hasStartedDWG.current = true;
      setStatus("request-permissions");
      isle.startRequestDelegatedWriteGrant({
        consumer: {
          consumerPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          meta: {
            url: "https://consumer-and-issuer-demo.vercel.app/",
            name: "NeoBank",
            logo: "https://consumer-and-issuer-demo.vercel.app/static/logo.svg",
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
    } else if (idvStatus === "rejected") {
      console.log("IDV verification rejected");
      setStatus("not-verified");
      isle.send("update", {
        status: "error",
      });
    } else if (idvStatus === "pending") {
      console.log("IDV verification pending");
      setStatus("pending-verification");
      // Don't send update here since we want to keep the UI state
    }
  }, [idvStatus, isle, status]);

  // Add logging for idvStatus changes
  useEffect(() => {
    console.log("IDV Status changed:", idvStatus);
  }, [idvStatus]);

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

  const handleKYCJourneySuccess = useCallback(
    async (data: { token: string }) => {
      const [error] = await goTry(async () => {
        // Wait for the refetch to complete and get fresh data
        const { data: freshUserData } = await refetchUserData();

        invariant(
          freshUserData?.idOSProfile,
          "`idOSUser` is not defined. Has a user been created?",
        );
        invariant(signer, "`signer` is not defined");

        const { idvUserId, signature } = await getUserIdFromToken(
          data.token,
          freshUserData.idOSProfile.id,
        );

        invariant(idvUserId, "Failed to get IDV User ID from token");
        invariant(signature, "Failed to get signature from token");

        await createIDVAttribute.mutateAsync({
          idvUserId,
          signature,
          signer,
          userId: freshUserData.idOSProfile.id,
        });

        // Refetch user data to get the new idvUserId
        await refetchUserData();

        kycDisclosure.onClose();
        setStatus("pending-verification");
      });

      if (error) {
        console.error("Error in KYC journey success handler:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        kycDisclosure.onClose();
      }
    },
    [refetchUserData, signer, createIDVAttribute, kycDisclosure],
  );

  const handleKYCJourneyError = useCallback(
    (error: unknown) => {
      kycDisclosure.onClose();
    },
    [kycDisclosure],
  );

  const statusIndexSrc = {
    "no-profile": 0,
    "not-verified": 1,
    "pending-verification": 2,
    "request-permissions": 3,
    verified: 4,
  };

  const index = statusIndexSrc[status as keyof typeof statusIndexSrc] || 0;

  // Add logging for status and index
  useEffect(() => {
    console.log("Current status:", status);
    console.log("Current stepper index:", index);
  }, [status, index]);

  return (
    <div className="container relative mr-auto flex h-screen w-[60%] flex-col items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with NeoBank</h1>
      <div className="flex w-full flex-col gap-6">
        <Portfolio />
      </div>
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
