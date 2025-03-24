"use client";

import { useDisclosure } from "@heroui/react";
import { createAttribute, getAttributes, hasProfile } from "@idos-network/core";
import {
  createIssuerConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
} from "@idos-network/issuer-sdk-js/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JsonRpcSigner } from "ethers";
import { goTry } from "go-try";
import { useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { createCredential, createIDOSUserProfile, getUserIdFromToken } from "@/actions";
import { useIsleController } from "@/isle.provider";

import { useEthersSigner } from "@/wagmi.config";
import invariant from "tiny-invariant";
import { KYCJourney } from "./kyc-journey";

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
        idvUserId: idvUserId ? JSON.parse(idvUserId).idvUserId : null,
        idOSProfile,
      };
    },
    enabled: Boolean(signer),
    refetchOnWindowFocus: false,
  });
};

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
    enabled: Boolean(userId),
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the results
  });
};

export const useCreateIDVAttribute = () => {
  return useMutation({
    mutationFn: async (data: {
      idvUserId: string;
      signature: string;
      signer: JsonRpcSigner;
    }) => {
      const { signer } = data;
      const config = await createIssuerConfig({
        nodeUrl: "https://nodes.playground.idos.network",
        signer,
      });
      return createAttribute(config.kwilClient, {
        id: crypto.randomUUID(),
        attribute_key: "idvUserId",
        value: JSON.stringify({ idvUserId: data.idvUserId }),
      });
    },
  });
};

export function Onboarding() {
  const { isleController } = useIsleController();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  const signer = useEthersSigner();
  const userData = useFetchUserData(signer);
  const idvStatus = useFetchIDVStatus(userData.data?.idvUserId);
  const createIDVAttribute = useCreateIDVAttribute();

  const kycDisclosure = useDisclosure();

  const queryClient = useQueryClient();

  const handleCreateProfile = useCallback(async () => {
    const [error] = await goTry(async () => {
      const userId = crypto.randomUUID();

      const { userEncryptionPublicKey } = await getUserEncryptionPublicKey(userId, {
        container: "#idOS-enclave",
        url: "https://enclave.playground.idos.network",
      });

      const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
      const signature = await signMessageAsync({ message });

      isleController?.send("update-create-profile-status", {
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

      await queryClient.invalidateQueries({
        queryKey: ["user-data"],
      });

      isleController?.send("update-create-profile-status", {
        status: "success",
      });

      setTimeout(() => {
        isleController?.updateIsleStatus("not-verified");
        isleController?.toggleAnimation({
          expanded: true,
          noDismiss: true,
        });
      }, 2_000);
    });

    if (error) {
      console.error(error);
      isleController?.send("update-create-profile-status", {
        status: "error",
      });
    }
  }, [isleController, signMessageAsync, address, queryClient]);

  const handleKYCSuccess = useCallback(
    async ({ token }: { token: string }) => {
      invariant(userData.data?.idOSProfile, "`idOSProfile` not found");
      invariant(signer, "`signer` is not defined");

      const { idvUserId, signature } = await getUserIdFromToken(
        token,
        userData.data?.idOSProfile.id,
      );
      await createIDVAttribute.mutateAsync({
        idvUserId,
        signature,
        signer,
      });

      await queryClient.invalidateQueries({
        queryKey: ["user-data"],
      });

      isleController?.updateIsleStatus("pending-verification");
      kycDisclosure.onClose();
    },
    [userData, kycDisclosure, signer, createIDVAttribute, queryClient, isleController],
  );

  const handleKYCError = useCallback(async (error: unknown) => {}, []);

  const handleCredentialIssuance = useCallback(async () => {
    const [error] = await goTry(async () => {
      invariant(signer, "Signer is not initialized");
      invariant(userData.data?.hasProfile, "IDOS Profile not found");
      invariant(userData.data?.idvUserId, "IDV User ID not found");
      invariant(userData.data?.idOSProfile, "IDOS User not found");

      const response = await isleController?.requestDelegatedWriteGrant({
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
        console.log("writeGrant", writeGrant);

        await createCredential(
          userData.data?.idvUserId,
          userData.data?.idOSProfile.recipient_encryption_public_key,
          writeGrant.owner_wallet_identifier,
          writeGrant.grantee_wallet_identifier,
          writeGrant.issuer_public_key,
          writeGrant.id,
          writeGrant.access_grant_timelock,
          writeGrant.not_usable_before,
          writeGrant.not_usable_after,
          signature,
        );

        isleController?.updateIsleStatus("verified");
      }
    });

    if (error) {
      console.error("Error in request-dwg handler:", error);
    }
  }, [isleController, signer, userData]);

  useEffect(() => {
    if (!isleController) return;

    const cleanup = isleController.onMessage(async (message) => {
      switch (message.type) {
        case "create-profile":
          await handleCreateProfile();
          break;

        case "verify-identity": {
          kycDisclosure.onOpen();
          break;
        }

        // @todo: figure out better API. I don't like the `updated` concept at all.
        case "updated": {
          if (message.data.status === "not-verified") {
            if (idvStatus.data === "approved") {
              // await handleCredentialIssuance();
            }
          }
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
  }, [isleController, handleCreateProfile, kycDisclosure, idvStatus]);

  return (
    <div className="container relative mr-auto flex h-screen w-[60%] flex-col place-content-center items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with NeoBank</h1>
      {kycDisclosure.isOpen ? (
        <KYCJourney onSuccess={handleKYCSuccess} onError={handleKYCError} />
      ) : null}
    </div>
  );
}
