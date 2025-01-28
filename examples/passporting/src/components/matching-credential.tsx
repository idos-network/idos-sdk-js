"use client";

import { Button } from "@heroui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { skipToken, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import { invokePassportingService } from "@/actions";
import { useIdOS } from "@/idOS.provider";

import { CredentialCard } from "./credential-card";

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();

  return useSuspenseQuery({
    queryKey: ["credential-details", id],
    queryFn: id ? () => idOS.data.get<idOSCredential>("credentials", id, false) : skipToken,
  });
};

export const useFetchSharedCredentialFromUser = () => {
  const idOS = useIdOS();
  return useSuspenseQuery({
    queryKey: ["shared-credential"],
    queryFn: () =>
      fetch(`/api/shared-credential/${idOS.auth.currentUser.userId}`).then((res) => res.json()),
  });
};

const CREDENTIAL_ID = process.env.NEXT_PUBLIC_DUMMY_CREDENTIAL_ID;

function useShareCredential() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const idOS = useIdOS();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const contentHash = await idOS.data.getCredentialContentSha256Hash(credentialId);
      const lockedUntil = 0;

      const granteeSigningPublicKey = process.env.NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY;
      const granteeEncryptionPublicKey = process.env.NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY;

      invariant(granteeSigningPublicKey, "NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY is not set");
      invariant(granteeEncryptionPublicKey, "NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY is not set");

      const { id } = await idOS.data.shareCredential(credentialId, granteeEncryptionPublicKey, {
        granteeAddress: granteeSigningPublicKey,
        lockedUntil: 0,
      });

      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: granteeSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      const message: string = await idOS.data.requestDAGSignature(dag);
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
  // We assume that the credential that we need has the hardcoded `id`.
  // In real life, we need to list all the credentials and find the one that we need.
  // That can be done by searching the `public_notes` field for values like `type=human` etc.
  invariant(CREDENTIAL_ID, "NEXT_PUBLIC_DUMMY_CREDENTIAL_ID is not set");

  const credential = useFetchCredential(CREDENTIAL_ID);
  const sharedCredentialFromUser = useFetchSharedCredentialFromUser();

  const shareCredential = useShareCredential();

  const handleCredentialDuplicateProcess = () => {
    if (!credential.data) return;

    shareCredential.mutate(credential.data.id);
  };

  if (sharedCredentialFromUser.data) {
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
      <CredentialCard credential={credential.data as idOSCredential} />
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
