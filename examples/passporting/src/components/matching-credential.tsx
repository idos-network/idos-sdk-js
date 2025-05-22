"use client";

import { Button, Link } from "@heroui/react";
import type { idOSCredential } from "@idos-network/core";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { useSignMessage } from "wagmi";

import { invokePassportingService } from "@/actions";
import { useIDOSClient } from "@/idOS.provider";
import { CredentialCard } from "./credential-card";

const useFetchMatchingCredential = () => {
  const idOSClient = useIDOSClient();

  return useQuery({
    queryKey: ["matching-credential"],
    queryFn: async () => {
      invariant(idOSClient.state === "logged-in");
      return idOSClient.getAllCredentials();
    },
    select: (credentials) => {
      const credential = credentials.find((credential) => {
        const publicNotes = credential.public_notes ? JSON.parse(credential.public_notes) : {};
        return publicNotes.type === "KYC DATA";
      });
      return credential;
    },
    enabled: idOSClient.state === "logged-in",
  });
};

export const useFetchSharedCredentialFromUser = () => {
  const idOSClient = useIDOSClient();

  return useQuery<{ credential: idOSCredential | null; cause: string }>({
    queryKey: ["shared-credential"],
    queryFn: async () => {
      invariant(idOSClient.state === "logged-in");

      const res = await fetch(`/api/shared-credential/${idOSClient.user.id}`);
      return (await res.json()) as { credential: idOSCredential | null; cause: string };
    },
    enabled: idOSClient.state === "logged-in",
  });
};

function useShareCredential() {
  const { address } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const idOSClient = useIDOSClient();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      invariant(idOSClient.state === "logged-in");

      const contentHash = await idOSClient.getCredentialContentSha256Hash(credentialId);
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

      const { id } = await idOSClient.createCredentialCopy(
        credentialId,
        consumerEncryptionPublicKey,
        consumerSigningPublicKey,
        0,
      );

      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: consumerSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      const message: string = await idOSClient.requestDAGMessage(dag);
      const signature = await signMessageAsync({ message });

      return invokePassportingService({
        ...dag,
        dag_signature: signature,
      });
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["shared-credential"] });
    },
  });
}

export function MatchingCredential() {
  const idOSClient = useIDOSClient();
  const matchingCredential = useFetchMatchingCredential();
  const sharedCredentialFromUser = useFetchSharedCredentialFromUser();
  const shareCredential = useShareCredential();

  const handleCredentialDuplicateProcess = () => {
    if (!matchingCredential.data) {
      return;
    }

    shareCredential.mutate(matchingCredential.data.id);
  };

  if (idOSClient.state === "with-user-signer") {
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL;

    invariant(issuerUrl, "NEXT_PUBLIC_ISSUER_URL is not set");

    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <h1 className="font-semibold text-2xl">No idOS profile found for this address 😔</h1>
        <p>Click the button below to create one:</p>
        <Button as={Link} href={issuerUrl} className="fit-content" target="_blank" rel="noreferrer">
          Create an idOS profile
        </Button>
      </div>
    );
  }

  if (!matchingCredential.data) {
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL;
    invariant(issuerUrl, "`NEXT_PUBLIC_ISSUER_URL` is not set");

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

  if (sharedCredentialFromUser.data?.credential?.public_notes) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-semibold text-2xl">
          You have successfully shared your credential with us!
        </h3>
        <CredentialCard credential={sharedCredentialFromUser.data.credential} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold text-2xl">
        We have found a matching credential that we can reuse:
      </h3>
      <CredentialCard credential={matchingCredential.data} />
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
