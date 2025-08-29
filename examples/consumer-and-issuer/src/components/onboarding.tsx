"use client";

import { Button, cn, useDisclosure } from "@heroui/react";
import type { IsleStatus, idOSPassportingPeer } from "@idos-network/core";
import type { idOSCredential } from "@idos-network/credentials";
import { useStore } from "@nanostores/react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClickAway } from "@uidotdev/usehooks";
import { AnimatePresence, motion } from "framer-motion";
import { goTry } from "go-try";
import { RocketIcon, ScanEyeIcon, ShieldEllipsisIcon, ShieldIcon, User2Icon } from "lucide-react";
import { atom } from "nanostores";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import invariant from "tiny-invariant";

import {
  createCredential,
  createIDOSUserProfile,
  getUserIdFromToken,
  invokePassportingService,
} from "@/actions";
import { useOnboardingStore } from "@/app/stores/onboarding";
import { useWalletStore } from "@/app/stores/wallet";
import { useIsleController } from "@/isle.provider";
import { useNearWallet } from "@/near.provider";
import { KYCJourney } from "./kyc-journey";
import { MatchingCredential } from "./matching-acme-credential";

function StepIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 w-10 shrink-0 place-content-center items-center rounded-md border border-neutral-200 bg-white text-neutral-900 drop-shadow">
      {icon}
    </div>
  );
}

function OnboardingStep({
  isActive = false,
  children,
}: {
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 font-semibold text-md",
        isActive ? undefined : "opacity-30",
      )}
    >
      {children}
    </li>
  );
}

function CreateProfileStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Create an idOS profile</h1>
      <p className="text-lg text-neutral-500">
        You will be prompted to create an idOS key. Afterwards, we will create an idOS profile for
        you. Please, follow the prompts to complete the process.
      </p>
    </div>
  );
}

function IdentityVerificationStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Identity verification</h1>
      <p className="text-lg text-neutral-500">
        We need to verify your identity. This is a mandatory step to continue. Please have your ID
        ready. This is done via a 3rd party service integrated with us.
      </p>
    </div>
  );
}

function IdentityVerificationInProgressStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Pending verification</h1>
      <p className="text-lg text-neutral-500">
        Your data is being processed. Please be patient. It will take a few minutes.
      </p>
    </div>
  );
}

function PermissionsStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Permissions</h1>
      <p className="text-lg text-neutral-500">
        Please grant the necessary permissions so NeoBank can issue a credential to your idOS
        profile.
      </p>
    </div>
  );
}

const $claimSuccess = atom(false);
const $goToACMECardProvider = atom(false);

function ClaimCardStepDescription() {
  const shareCredentialWithConsumer = useShareCredentialWithConsumer();
  const matchingCredential = useFetchMatchingCredential();

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Welcome to NeoBank!</h1>
      <p className="text-lg text-neutral-500">
        You can now claim your exclusive high-limit credit card and start your premium banking
        journey.
      </p>
      <Image
        src="/static/acme-card.jpg"
        alt="NeoBank"
        className="h-auto w-[80%] rounded-[24px]"
        width={240}
        height={240}
      />
      <Button
        className="w-fit"
        color="primary"
        size="lg"
        onPress={() => {
          shareCredentialWithConsumer.mutate(matchingCredential.data ?? null, {
            onSuccess: () => {
              $claimSuccess.set(true);
            },
          });
        }}
        isLoading={shareCredentialWithConsumer.isPending}
      >
        Claim your card
      </Button>
    </div>
  );
}

function ClaimCardSuccessStepDescription({
  goToACMECardProvider,
}: {
  goToACMECardProvider: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 15_000);

    return () => clearTimeout(timer);
  }, []);

  invariant(
    process.env.NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL,
    "`NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL` is not set",
  );

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <h1 className="font-bold text-4xl">Welcome to NeoBank!</h1>

      <h4 className="text-center font-normal text-neutral-500 text-xl">
        You have successfully claimed your exclusive high-limit credit card and started your premium
        banking journey!
      </h4>
      <Image
        src="/static/acme-card.jpg"
        alt="NeoBank"
        className="h-auto w-[80%] rounded-[24px]"
        width={240}
        height={240}
        priority
      />
      <Button
        color="default"
        className="w-fit bg-black text-white dark:bg-white dark:text-black"
        size="lg"
        as="button"
        onPress={() => {
          goToACMECardProvider();
        }}
      >
        Go to ACME card provider
      </Button>
      <Confetti run={showConfetti} recycle={false} numberOfPieces={200} />
    </div>
  );
}

const useFetchUserData = () => {
  const { isleController } = useIsleController();

  return useQuery({
    queryKey: ["user-data"],
    queryFn: async () => {
      invariant(isleController, "`isleController` not initialized");
      invariant(isleController.idosClient?.state === "logged-in", "`idosClient` is not logged in");

      // Then get the attributes using the same authenticated session
      const attributes = await isleController.idosClient.getAttributes();

      const attributeValue = attributes.find(
        (attribute) => attribute.attribute_key === "idvUserId",
      )?.value;

      const idvTicket = JSON.parse((attributeValue || "null") as string) as IdvTicket | null;
      if (idvTicket) {
        invariant(idvTicket.idvUserId, "`idvUserId` missing from attribute");
        invariant(idvTicket.idOSUserId, "`idOSUserId` missing from attribute");
        invariant(idvTicket.signature, "`signature` missing from attribute");
      }

      return idvTicket;
    },
    enabled: Boolean(isleController?.idosClient.state === "logged-in"),
    refetchOnWindowFocus: false,
  });
};

type IdvTicket = { idvUserId: string; idOSUserId: string; signature: string };
const useFetchIDVStatus = (params: IdvTicket | undefined | null) => {
  const { isleController } = useIsleController();

  return useQuery({
    queryKey: ["idv-status", params?.idvUserId],
    queryFn: async (): Promise<{ status: string }> => {
      invariant(params, "`params` is not defined");

      const { idvUserId, idOSUserId, signature } = params;

      const url = new URL(`/api/idv-status/${idvUserId}`, window.location.origin);

      url.searchParams.set("idOSUserId", idOSUserId);
      url.searchParams.set("signature", signature);

      const res = await fetch(url);
      return await res.json();
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
    enabled:
      Boolean(params?.idvUserId) && Boolean(isleController?.idosClient.state === "logged-in"),
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the results
  });
};

export const useCreateIDVAttribute = () => {
  const { isleController } = useIsleController();

  return useMutation({
    mutationFn: async (data: { idOSUserId: string; idvUserId: string; signature: string }) => {
      invariant(isleController?.idosClient.state === "logged-in", "`idosClient` is not logged in");

      const { idOSUserId, idvUserId, signature } = data;
      invariant(idOSUserId, "`idOSUserId` is required");
      invariant(idvUserId, "`idvUserId` is required");
      invariant(signature, "`signature` is required");

      return isleController.idosClient.createAttribute({
        id: crypto.randomUUID(),
        attribute_key: "idvUserId",
        value: JSON.stringify({ idOSUserId, idvUserId, signature }),
      });
    },
  });
};

const useIssueCredential = () => {
  const { isleController } = useIsleController();
  const _near = useNearWallet();
  const { walletPublicKey } = useWalletStore();

  return useMutation({
    mutationFn: async ({
      idvUserId,
      recipient_encryption_public_key,
    }: {
      idvUserId: string;
      recipient_encryption_public_key: string;
    }) => {
      invariant(isleController, "`isleController` not initialized");

      invariant(isleController.idosClient.state === "logged-in", "`idosClient` not logged in");

      invariant(
        process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
        "`NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL` is not set",
      );

      const dwgData = await isleController.requestDelegatedWriteGrant({
        consumer: {
          consumerAuthPublicKey: process.env.NEXT_PUBLIC_ISSUER_AUTH_PUBLIC_KEY_HEX ?? "",
          meta: {
            url: process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
            name: "NeoBank",
            logo: `${process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL}/static/logo.svg`,
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

        walletIdentifier: ["Stellar", "near"].includes(isleController.signerType)
          ? walletPublicKey
          : null,
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

function useShareCredentialWithConsumer() {
  const queryClient = useQueryClient();
  const { isleController } = useIsleController();
  const { walletPublicKey: publicKey, walletType } = useWalletStore();
  const _near = useNearWallet();

  return useMutation({
    mutationFn: async (
      matchingCredential: (idOSCredential & { passporting_server_url_base: string }) | null,
    ) => {
      invariant(isleController, "`isleController` not initialized");
      invariant(isleController.idosClient.state === "logged-in", "`idosClient` not logged in");
      invariant(matchingCredential, "`matchingCredential` not found");

      isleController.toggleAnimation({ expanded: true });

      invariant(matchingCredential, "`idOSCredential` to share not found");

      const contentHash = await isleController.idosClient.getCredentialContentSha256Hash(
        matchingCredential.id,
      );
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

      const { id } = await isleController.idosClient.createCredentialCopy(
        matchingCredential.id,
        consumerEncryptionPublicKey,
        consumerSigningPublicKey,
        0,
      );
      // Freighter flags immediate signatures calls as rejected so this is a safeguard
      await new Promise((resolve) => setTimeout(resolve, 300));
      invariant(walletType, "`walletType` is not set");
      const dag_owner_wallet_identifier = ["Stellar", "near"].includes(walletType)
        ? publicKey
        : isleController.idosClient.walletIdentifier || "";

      invariant(dag_owner_wallet_identifier, "`dag_owner_wallet_identifier` is not set");

      const dag = {
        dag_owner_wallet_identifier,
        dag_grantee_wallet_identifier: consumerSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      const message: string = await isleController.idosClient.requestDAGMessage(dag);
      const signature = await isleController.signTx(message);
      const result = await invokePassportingService(
        `${matchingCredential.passporting_server_url_base}/passporting-registry`,
        {
          ...dag,
          dag_signature: signature,
        },
      );

      if (!result.success) {
        console.error(result.error);
        throw new Error(result.error.message);
      }
    },
    onSuccess: (data) => {
      isleController?.updateIsleStatus("verified");
      queryClient.setQueryData(["shared-credential"], data);
    },
    onError: (error) => {
      console.error({ error });
    },
  });
}

const useFetchMatchingCredential = () => {
  const { isleController } = useIsleController();
  invariant(isleController?.idosClient.state === "logged-in", "`isleController` not logged in");

  const idOSClient = isleController.idosClient;

  return useQuery({
    queryKey: ["matching-credential"],
    queryFn: async () => {
      invariant(idOSClient.state === "logged-in");

      const peers = (await fetch("/api/passporting-peers").then((res) =>
        res.json(),
      )) as idOSPassportingPeer[];

      const credentials = await idOSClient.getAllCredentials();

      const matchingCredential = credentials.find((credential: idOSCredential) => {
        const publicNotes = credential.public_notes ? JSON.parse(credential.public_notes) : {};
        return publicNotes.type === "KYC DATA";
      });

      if (!matchingCredential) {
        return null;
      }

      const matchingPeer = peers.find(
        (peer) => peer.issuer_public_key === matchingCredential.issuer_auth_public_key,
      );

      if (!matchingPeer) {
        return null;
      }

      return {
        ...matchingCredential,
        passporting_server_url_base: matchingPeer.passporting_server_url_base,
      };
    },
    enabled: idOSClient.state === "logged-in",
  });
};

function SecureEnclaveRoot() {
  const { isleController } = useIsleController();
  return (
    <div
      id="idOS-enclave-root"
      className="invisible fixed top-0 left-0 z-[10000] flex aspect-square h-full w-full flex-col items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-in [&:has(#idOS-enclave.visible)]:visible [&:has(#idOS-enclave.visible)]:opacity-100"
    >
      <div className="absolute top-[50%] left-[50%] z-[2] flex h-fit w-11/12 translate-x-[-50%] translate-y-[-50%] flex-col gap-4 overflow-hidden rounded-lg bg-white p-6 shadow-md lg:w-[460px]">
        <h3 className="font-semibold text-2xl">
          {isleController?.idosClient.state === "logged-in"
            ? "Unlock your idOS key"
            : "Create your idOS key"}
        </h3>
        <p className="text-neutral-500 text-sm">
          {isleController?.idosClient.state === "logged-in"
            ? "You will be asked to enter your password to unlock your idOS key."
            : "This key is the key to your idOS data. Be careful not to lose it: you'll need it later to view or share your idOS data."}
        </p>

        <div className="relative h-full w-[200px] self-center">
          <div id="idOS-enclave" />
        </div>
      </div>
    </div>
  );
}
function AcmeCardProvider({ onExit }: { onExit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black backdrop-blur-sm"
    >
      <h3 className="absolute top-4 left-4 font-bold text-2xl text-white">ACME Card Provider</h3>
      <Button onPress={onExit} className="absolute top-4 right-4">
        X
      </Button>

      <MatchingCredential />
    </motion.div>
  );
}

const $step = atom<IsleStatus | undefined>(undefined);

export function Onboarding() {
  const { isleController } = useIsleController();
  const { address: evmAddress } = useAppKitAccount();
  const queryClient = useQueryClient();
  const { setClaimedSuccess, claimedSuccess, resetOnboarding } = useOnboardingStore();
  const userData = useFetchUserData();
  const idvStatus = useFetchIDVStatus(userData?.data);
  const createIDVAttribute = useCreateIDVAttribute();
  const issueCredential = useIssueCredential();
  const { walletPublicKey: publicKey, walletAddress: address } = useWalletStore();

  const kycDisclosure = useDisclosure();

  const hasIssuedCredential = useRef(false);

  const containerRef = useClickAway(() => {
    if (!isleController) return;

    isleController.toggleAnimation({
      expanded: false,
    });
  });

  const activeStep = useStore($step);

  const _near = useNearWallet();

  const handleCreateProfile = useCallback(async () => {
    const [error] = await goTry(async () => {
      invariant(
        isleController?.idosClient.state === "with-user-signer",
        "`idosClient` is not in `with-user-signer` state",
      );

      const userId = crypto.randomUUID();

      const userEncryptionProfile =
        await isleController.idosClient.createUserEncryptionProfile(userId);

      const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
      const signature = await isleController.signTx(message);
      isleController?.send("update-create-profile-status", {
        status: "pending",
      });

      await createIDOSUserProfile({
        userId,
        recipientEncryptionPublicKey: userEncryptionProfile.userEncryptionPublicKey,
        encryptionPasswordStore: userEncryptionProfile.encryptionPasswordStore,
        wallet: {
          address: address || "",
          type:
            isleController.signerType === "Stellar"
              ? "Stellar"
              : (isleController.signerType.toUpperCase() as "EVM" | "XRPL" | "NEAR" | "Stellar"),
          message,
          signature,
          publicKey: publicKey || (address as string),
        },
      });
      await isleController.logClientIn();

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
  }, [isleController, queryClient, address, publicKey]);

  const handleKYCSuccess = useCallback(
    async ({ token }: { token: string }) => {
      invariant(isleController?.idosClient.state === "logged-in", "`idosClient` not logged in");

      const idOSUserId = isleController.idosClient.user.id;
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
      });

      await queryClient.invalidateQueries({
        queryKey: ["user-data"],
      });

      isleController.updateIsleStatus("pending-verification");
      kycDisclosure.onClose();
    },
    [kycDisclosure, createIDVAttribute, queryClient, isleController],
  );

  const handleKYCError = useCallback(async (_error: unknown) => {}, []);

  useEffect(() => {
    if (!evmAddress) queryClient.setQueryData(["idv-status", userData?.data?.idvUserId], undefined);
  }, [evmAddress, queryClient, userData?.data?.idvUserId]);

  useEffect(() => {
    return () => {
      resetOnboarding();
      $step.set("no-profile");
    };
  }, [resetOnboarding]);

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
          const hasConsumerPermission = await isleController.hasConsumerPermission(
            isleController.options.credentialRequirements.integratedConsumers[1],
          );
          if (!hasConsumerPermission) {
            setClaimedSuccess(false);
          }
          break;
        }

        case "request-dwg": {
          invariant(userData.data, "`userData.data` not found");
          invariant(isleController.idosClient.state === "logged-in", "`idosClient` not logged in");

          issueCredential.mutate(
            {
              idvUserId: userData.data.idvUserId,
              recipient_encryption_public_key:
                isleController.idosClient.user.recipient_encryption_public_key,
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
  }, [
    handleCreateProfile,
    isleController,
    kycDisclosure,
    issueCredential,
    userData,
    setClaimedSuccess,
  ]);

  useEffect(() => {
    if (!isleController) return;
    if (!activeStep || activeStep === "verified") return;
    if (hasIssuedCredential.current) return;

    if (idvStatus.data === "pending") {
      $step.set("pending-verification");
      isleController.updateIsleStatus("pending-verification");
      return;
    }

    if (idvStatus.data === "approved") {
      invariant(userData.data, "`userData.data` not found");
      invariant(isleController.idosClient.state === "logged-in", "`idosClient` not logged in");

      $step.set("pending-permissions");

      hasIssuedCredential.current = true;

      issueCredential.mutate(
        {
          idvUserId: userData.data.idvUserId,
          recipient_encryption_public_key:
            isleController.idosClient.user.recipient_encryption_public_key,
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
  }, [idvStatus.data, userData.data, issueCredential.mutate, isleController, activeStep]);

  useEffect(() => {
    if (!isleController) return;

    return isleController.onIsleStatusChange(async (status) => {
      if (status === "verified") {
        const hasConsumerPermission = await isleController.hasConsumerPermission(
          isleController.options.credentialRequirements.integratedConsumers[1],
        );

        if (hasConsumerPermission) {
          setClaimedSuccess(true);
        }
      }
      $step.set(status);
    });
  }, [isleController, setClaimedSuccess]);

  const showACMECardProvider = useStore($goToACMECardProvider);

  return (
    <>
      {showACMECardProvider && <AcmeCardProvider onExit={() => $goToACMECardProvider.set(false)} />}
      <div className="container relative mx-auto min-h-dvh p-6">
        <div>
          <div className="flex h-full flex-col gap-8 lg:gap-12">
            <div className="flex flex-col">
              <ul className="flex flex-col gap-6 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-2.5 lg:flex-row lg:items-center">
                <OnboardingStep isActive={activeStep === "no-profile"}>
                  <StepIcon icon={<User2Icon />} />
                  <p>Create an idOS profile</p>
                </OnboardingStep>
                <OnboardingStep isActive={activeStep === "not-verified"}>
                  <StepIcon icon={<ShieldIcon />} />
                  <p>Identity verification</p>
                </OnboardingStep>
                <OnboardingStep isActive={activeStep === "pending-verification"}>
                  <StepIcon icon={<ShieldEllipsisIcon />} />
                  <p>Pending verification</p>
                </OnboardingStep>
                <OnboardingStep isActive={activeStep === "pending-permissions"}>
                  <StepIcon icon={<ScanEyeIcon />} />
                  <p>Permissions</p>
                </OnboardingStep>
                <OnboardingStep isActive={activeStep === "verified" || claimedSuccess}>
                  <StepIcon icon={<RocketIcon />} />
                  <p>Claim your ACME Bank card!</p>
                </OnboardingStep>
              </ul>
            </div>
            <div className="flex h-full flex-col justify-between gap-6 lg:flex-row">
              <div className="max-w-3xl">
                <AnimatePresence mode="wait">
                  {claimedSuccess ? (
                    <motion.div
                      key="no-profile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ClaimCardSuccessStepDescription
                        goToACMECardProvider={() => {
                          $goToACMECardProvider.set(true);
                        }}
                      />
                    </motion.div>
                  ) : (
                    <>
                      {activeStep === "no-profile" && (
                        <motion.div
                          key="no-profile"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CreateProfileStepDescription />
                        </motion.div>
                      )}
                      {activeStep === "not-verified" && (
                        <motion.div
                          key="not-verified"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <IdentityVerificationStepDescription />
                        </motion.div>
                      )}
                      {activeStep === "pending-verification" && (
                        <motion.div
                          key="pending-verification"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <IdentityVerificationInProgressStepDescription />
                        </motion.div>
                      )}
                      {activeStep === "pending-permissions" && (
                        <motion.div
                          key="pending-permissions"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <PermissionsStepDescription />
                        </motion.div>
                      )}
                      {activeStep === "verified" && (
                        <motion.div
                          key="verified"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ClaimCardStepDescription />
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div
                id="idOS-isle"
                ref={containerRef as React.RefObject<HTMLDivElement>}
                className="h-[670px] min-h-[670px] w-[366px] shrink-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        {kycDisclosure.isOpen ? (
          <KYCJourney onSuccess={handleKYCSuccess} onError={handleKYCError} />
        ) : null}

        <SecureEnclaveRoot />
      </div>
    </>
  );
}
