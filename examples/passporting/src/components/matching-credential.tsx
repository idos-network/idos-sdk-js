"use client";

import { Button, Link } from "@heroui/react";
import {
  createCredentialCopy,
  getAllCredentials,
  getCredentialContentSha256Hash,
  getUserProfile,
  requestDAGMessage,
} from "@idos-network/consumer-sdk-js/client";
import type { idOSCredential } from "@idos-network/core";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import { invokePassportingService } from "@/actions";
import { useIdOSConsumer } from "@/idOS.provider";

import { CredentialCard } from "./credential-card";

const useFetchMatchingCredential = () => {
  const consumerConfig = useIdOSConsumer();

  return useSuspenseQuery({
    queryKey: ["matching-credential"],
    queryFn: () => getAllCredentials(consumerConfig),
    select: (credentials) => {
      const credential = credentials.find((credential) => {
        const publicNotes = credential.public_notes ? JSON.parse(credential.public_notes) : {};
        return publicNotes.type === "KYC DATA";
      });
      return credential as unknown as idOSCredential;
    },
  });
};

export const useFetchSharedCredentialFromUser = () => {
  const consumerConfig = useIdOSConsumer();
  return useSuspenseQuery<idOSCredential | null>({
    queryKey: ["shared-credential"],
    queryFn: async () => {
      const { id: userId } = await getUserProfile(consumerConfig);
      return fetch(`/api/shared-credential/${userId}`)
        .then((res) => res.json())
        .catch(() => {
          return null;
        });
    },
  });
};

function useShareCredential() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const consumerConfig = useIdOSConsumer();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const contentHash = await getCredentialContentSha256Hash(consumerConfig, credentialId);
      const lockedUntil = 0;

      const consumerSigningPublicKey = process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY;
      const consumerEncryptionPublicKey =
        process.env.NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY;

      invariant(
        consumerSigningPublicKey,
        "NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY is not set",
      );
      invariant(
        consumerEncryptionPublicKey,
        "NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY is not set",
      );

      const { id } = await createCredentialCopy(
        consumerConfig,
        credentialId,
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
      queryClient.setQueryData(["shared-credential"], data);
    },
  });
}

export function MatchingCredential() {
  const matchingCredential = useFetchMatchingCredential();
  const sharedCredentialFromUser = useFetchSharedCredentialFromUser();
  const shareCredential = useShareCredential();

  const handleCredentialDuplicateProcess = () => {
    if (!matchingCredential.data) return;

    shareCredential.mutate(matchingCredential.data.id);
  };

  if (!matchingCredential.data) {
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL;
    invariant(issuerUrl, "NEXT_PUBLIC_ISSUER_URL is not set");

    return (
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-semibold text-2xl">No matching credential found 😔</h1>
        <p className="text-sm">
          We couldn't find a matching credential in your idOS account. Click the button bellow to
          get a new credential that we can reuse:
        </p>
        <Button as={Link} className="w-fit" href={issuerUrl} target="_blank">
          Get a new credential
        </Button>
      </div>
    );
  }
  console.log({ data: sharedCredentialFromUser.data, matchingCredential });

  if (sharedCredentialFromUser.data?.public_notes) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-semibold text-2xl">
          You have successfully shared your credential with us!
        </h3>
        <CredentialCard credential={sharedCredentialFromUser.data} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold text-2xl">
        We have found a matching credential that we can reuse:
      </h3>
      <CredentialCard credential={matchingCredential.data as idOSCredential} />
      <div>
        <p className="text-green-500 text-sm">
          In order to proceed, we need to request an encrypted duplicate of this credential.
        </p>
        <p className="text-green-500 text-sm">Click the button below to start the process:</p>
      </div>
      <Button onPress={handleCredentialDuplicateProcess} isLoading={shareCredential.isPending}>
        {shareCredential.isPending
          ? "Requesting credential duplicate..."
          : "Request credential duplicate"}
      </Button>
    </div>
  );
}
