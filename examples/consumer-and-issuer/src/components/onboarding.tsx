"use client";

import { Button, useDisclosure } from "@heroui/react";
import {
  createConsumerClientConfig,
  createCredentialCopy,
  getAllCredentials,
  getUserProfile as getConsumerUserData,
  getCredentialContentSha256Hash,
  requestDAGMessage,
} from "@idos-network/consumer-sdk-js/client";
import { base64Decode, base64Encode, type idOSCredential } from "@idos-network/core";
import { createAttribute, getAttributes } from "@idos-network/core/kwil-actions";
import {
  type IssuerClientConfig,
  createIssuerClientConfig,
  getUserEncryptionPublicKey,
  getUserProfile,
  hasProfile,
} from "@idos-network/issuer-sdk-js/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JsonRpcSigner } from "ethers";
import { goTry } from "go-try";
import { useCallback, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import {
  createCredential,
  createIDOSUserProfile,
  getUserIdFromToken,
  invokePassportingService,
} from "@/actions";
import { useIsleController } from "@/isle.provider";
import { useEthersSigner } from "@/wagmi.config";

import nacl from "tweetnacl";
import { Card } from "./card";
import { KYCJourney } from "./kyc-journey";
import { Stepper } from "./stepper";

const enclaveOptions = {
  container: "#idOS-enclave",
  url: "https://enclave.idos.network",
};

type IdvTicket = { idvUserId: string; idOSUserId: string; signature: string };

const useFetchUserData = (
  config: IssuerClientConfig | undefined,
  signer: JsonRpcSigner | undefined,
) => {
  return useQuery({
    queryKey: ["user-data"],
    queryFn: async () => {
      if (!config) throw new Error("IssuerConfig is not initialized");
      if (!signer) throw new Error("Signer is not initialized");

      const hasUserProfile = await hasProfile(config);
      if (!hasUserProfile) return null;

      // First get the user profile which handles authentication
      const idOSProfile = await getUserProfile(config);

      // Then get the attributes using the same authenticated session
      const attributes = await getAttributes(config.kwilClient);

      const attributeValue = attributes.find(
        (attribute) => attribute.attribute_key === "idvUserId",
      )?.value;

      const idvTicket = JSON.parse((attributeValue || "null") as string) as IdvTicket | null;
      if (idvTicket) {
        invariant(idvTicket.idvUserId, "`idvUserId` missing from attribute");
        invariant(idvTicket.idOSUserId, "`idOSUserId` missing from attribute");
        invariant(idvTicket.signature, "`signature` missing from attribute");
      }

      return {
        hasProfile: hasUserProfile,
        idOSProfile,
        idvTicket,
      };
    },
    enabled: Boolean(signer),
    refetchOnWindowFocus: false,
  });
};

const useFetchIDVStatus = (params: IdvTicket | undefined | null) => {
  return useQuery({
    queryKey: ["idv-status", params?.idvUserId],
    queryFn: (): Promise<{ status: string }> => {
      invariant(params, "`params` is not defined");

      const { idvUserId, idOSUserId, signature } = params;

      const url = new URL(`/api/idv-status/${idvUserId}`, window.location.origin);

      url.searchParams.set("idOSUserId", idOSUserId);
      url.searchParams.set("signature", signature);

      return fetch(url).then((res) => res.json());
    },
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
    enabled: Boolean(params?.idvUserId),
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the results
  });
};

export const useCreateIDVAttribute = () => {
  return useMutation({
    mutationFn: async (data: {
      idOSUserId: string;
      idvUserId: string;
      signature: string;
      config: IssuerClientConfig;
    }) => {
      const { idOSUserId, idvUserId, signature, config } = data;
      invariant(idOSUserId, "`idOSUserId` is required");
      invariant(idvUserId, "`idvUserId` is required");
      invariant(signature, "`signature` is required");

      return createAttribute(config.kwilClient, {
        id: crypto.randomUUID(),
        attribute_key: "idvUserId",
        value: JSON.stringify({ idOSUserId, idvUserId, signature }),
      });
    },
  });
};

const useIssueCredential = () => {
  const { isleController } = useIsleController();

  return useMutation({
    mutationFn: async ({
      idvUserId,
      recipient_encryption_public_key,
    }: { idvUserId: string; recipient_encryption_public_key: string }) => {
      const dwgData = await isleController?.requestDelegatedWriteGrant({
        consumer: {
          consumerAuthPublicKey: process.env.NEXT_PUBLIC_ISSUER_AUTH_PUBLIC_KEY_HEX ?? "",
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

      if (!dwgData) throw new Error("DWG data not found");

      const { signature, writeGrant } = dwgData;

      await createCredential(
        idvUserId,
        recipient_encryption_public_key,
        writeGrant.owner_wallet_identifier,
        writeGrant.grantee_wallet_identifier,
        writeGrant.issuer_public_key,
        writeGrant.id,
        writeGrant.access_grant_timelock,
        writeGrant.not_usable_before,
        writeGrant.not_usable_after,
        signature,
      );
    },
  });
};

const useRequestPermission = () => {
  const { isleController } = useIsleController();

  return useMutation({
    mutationFn: async () => {
      await isleController?.requestPermission({
        consumer: {
          meta: {
            url: "https://idos.network",
            name: "ACME Card Provider",
            logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
          },
          consumerAuthPublicKey: process.env.NEXT_PUBLIC_INTEGRATED_CONSUMER_AUTH ?? "",
          consumerEncryptionPublicKey: process.env.NEXT_PUBLIC_INTEGRATED_CONSUMER_ENC ?? "",
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
    },
  });
};

const STEPPER_ACTIVE_INDEX = {
  "no-profile": 0,
  "not-verified": 1,
  "pending-verification": 2,
  "pending-permissions": 3,
  verified: 4,
};

function useIssuerClientConfig(signer: JsonRpcSigner | undefined) {
  const [config, setConfig] = useState<IssuerClientConfig | undefined>(undefined);
  useEffect(() => {
    if (!signer) return;

    const initialize = async () => {
      const _config = await createIssuerClientConfig({
        nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
        signer,
        enclaveOptions,
      });

      setConfig(_config);
    };

    initialize();
  }, [signer]);

  return config;
}

function useShareCredentialWithConsumer() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();
  const queryClient = useQueryClient();
  const { isleController } = useIsleController();

  return useMutation({
    mutationFn: async () => {
      invariant(signer, "`Signer` is not defined");
      const consumerConfig = await createConsumerClientConfig({
        nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
        signer,
        enclaveOptions: {
          container: "#idOS-enclave",
        },
      });

      const credentials = await getAllCredentials(consumerConfig);
      const userData = await getConsumerUserData(consumerConfig);

      const credential = credentials.find((credential: idOSCredential) => {
        const publicNotes = credential.public_notes ? JSON.parse(credential.public_notes) : {};
        return publicNotes.type === "KYC DATA";
      });

      invariant(credential, "`idOSCredential` to share not found");

      await consumerConfig.enclaveProvider.ready(
        userData.id,
        userData.recipient_encryption_public_key,
      );

      const contentHash = await getCredentialContentSha256Hash(consumerConfig, credential.id);
      const lockedUntil = 0;

      const consumerSigningPublicKey = process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY;
      const consumerEncryptionPublicKey =
        process.env.NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY;

      invariant(
        consumerSigningPublicKey,
        "`NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY` is not set",
      );
      invariant(
        consumerEncryptionPublicKey,
        "`NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY` is not set",
      );

      const { id } = await createCredentialCopy(
        consumerConfig,
        credential.id,
        consumerEncryptionPublicKey,
        {
          consumerAddress: consumerSigningPublicKey,
          lockedUntil: 0,
        },
      );

      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: consumerSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      const message: string = await requestDAGMessage(consumerConfig, dag);
      const signature = await signMessageAsync({ message });

      return invokePassportingService({
        ...dag,
        dag_signature: signature,
      });
    },
    onSuccess: (data) => {
      isleController?.updateIsleStatus("verified");
      queryClient.setQueryData(["shared-credential"], data);
    },
  });
}

export function Onboarding() {
  const { isleController } = useIsleController();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  const signer = useEthersSigner();
  const config = useIssuerClientConfig(signer);
  const userData = useFetchUserData(config, signer);
  if (userData.error) {
    console.error(userData.error);
    isleController?.send("update", { status: "error" });
  }
  const idvStatus = useFetchIDVStatus(userData?.data?.idvTicket);
  const createIDVAttribute = useCreateIDVAttribute();

  const issueCredential = useIssueCredential();
  const requestPermission = useRequestPermission();

  const hasIssuedCredential = useRef(false);

  const kycDisclosure = useDisclosure();

  const queryClient = useQueryClient();

  const [stepperStatus, setStepperStatus] = useState("");

  const handleCreateProfile = useCallback(async () => {
    const [error] = await goTry(async () => {
      invariant(config, "`config` not created yet");
      const userId = crypto.randomUUID();

      const { userEncryptionPublicKey } = await getUserEncryptionPublicKey(config, userId);

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

      config.enclaveProvider.options.mode = "existing";

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
  }, [isleController, signMessageAsync, address, queryClient, config]);

  const handleKYCSuccess = useCallback(
    async ({ token }: { token: string }) => {
      invariant(userData.data?.idOSProfile, "`idOSProfile` not found");
      invariant(signer, "`Signer` is not defined");
      invariant(config, "`IssuerConfig` is not defined");

      const idOSUserId = userData.data?.idOSProfile.id;
      invariant(idOSUserId, "`idOSUserId` can't be discovered");
      const { ok, error, data } = await getUserIdFromToken(token, idOSUserId);
      invariant(ok, JSON.stringify(error, null, 2));
      invariant(data, "`data` is missing, even though `ok` is true");
      const { idvUserId, signature } = data;
      invariant(idvUserId, "`idvUserId` can't be discovered");

      await createIDVAttribute.mutateAsync({
        idOSUserId,
        idvUserId,
        signature,
        config,
      });

      await queryClient.invalidateQueries({
        queryKey: ["user-data"],
      });

      isleController?.updateIsleStatus("pending-verification");
      kycDisclosure.onClose();
    },
    [userData, kycDisclosure, signer, createIDVAttribute, queryClient, isleController, config],
  );

  const handleKYCError = useCallback(async (error: unknown) => {}, []);

  useEffect(() => {
    if (!isleController) return;

    return isleController.onIsleStatusChange((status) => {
      setStepperStatus(status);
    });
  }, [isleController]);

  useEffect(() => {
    if (!isleController) return;

    const cleanup = isleController.onIsleMessage(async (message) => {
      switch (message.type) {
        case "create-profile":
          await handleCreateProfile();
          break;

        case "verify-identity": {
          kycDisclosure.onOpen();
          break;
        }

        case "view-credential-details": {
          await isleController.viewCredentialDetails(message.data.id);
          break;
        }

        case "revoke-permission": {
          await isleController.revokePermission(message.data.id);
          break;
        }

        case "request-dwg": {
          invariant(userData.data, "`userData.data` not found");
          invariant(userData.data.idvTicket, "`userData.data.idvTicket` not found");

          issueCredential.mutate(
            {
              idvUserId: userData.data.idvTicket.idvUserId,
              recipient_encryption_public_key:
                userData.data.idOSProfile.recipient_encryption_public_key,
            },
            {
              onSuccess: () => {
                isleController.updateIsleStatus("verified");
              },
            },
          );
          break;
        }

        default:
          break;
      }
    });

    return cleanup;
  }, [handleCreateProfile, isleController, kycDisclosure, issueCredential, userData]);

  useEffect(() => {
    if (!isleController) return;
    if (!stepperStatus || stepperStatus === "verified") return;
    if (hasIssuedCredential.current) return;

    if (idvStatus.data === "pending") {
      setStepperStatus("pending-verification");
      isleController.updateIsleStatus("pending-verification");
      return;
    }

    if (idvStatus.data === "approved") {
      invariant(userData.data, "`userData.data` not found");
      invariant(userData.data.idvTicket, "`userData.data.idvTicket` not found");

      setStepperStatus("request-permissions");

      hasIssuedCredential.current = true;

      issueCredential.mutate(
        {
          idvUserId: userData.data.idvTicket.idvUserId,
          recipient_encryption_public_key:
            userData.data.idOSProfile.recipient_encryption_public_key,
        },
        {
          onSuccess: () => {
            isleController.updateIsleStatus("verified");
          },
          onError: (error) => {
            console.error(error);
          },
        },
      );
      return;
    }
  }, [idvStatus.data, userData.data, issueCredential.mutate, isleController, stepperStatus]);

  const shareCredentialWithConsumer = useShareCredentialWithConsumer();

  return (
    <div className="container relative mr-auto flex h-screen w-[60%] flex-col items-center gap-6">
      <h1 className="font-bold text-4xl">Onboarding with NeoBank</h1>
      <Stepper
        activeIndex={STEPPER_ACTIVE_INDEX[stepperStatus as keyof typeof STEPPER_ACTIVE_INDEX]}
      />
      {kycDisclosure.isOpen ? (
        <KYCJourney onSuccess={handleKYCSuccess} onError={handleKYCError} />
      ) : null}

      {stepperStatus === "verified" ? (
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
              <Button
                size="lg"
                color="primary"
                onPress={() => {
                  shareCredentialWithConsumer.mutate(undefined, {
                    onError: (error) => {
                      console.error(error);
                    },
                  });
                }}
                isLoading={shareCredentialWithConsumer.isPending}
              >
                Claim your Acme Card now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
