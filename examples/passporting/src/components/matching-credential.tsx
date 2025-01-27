"use client";

import { Button } from "@heroui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { skipToken } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTransition } from "react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { useSignMessage } from "wagmi";
import { useAccount } from "wagmi";

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

const CREDENTIAL_ID = process.env.NEXT_PUBLIC_DUMMY_CREDENTIAL_ID;

export function MatchingCredential() {
  // We assume that the credential that we need has the hardcoded `id`.
  // In real life, we need to list all the credentials and find the one that we need.
  // That can be done by searching the `public_notes` field for values like `type=human` etc.
  invariant(CREDENTIAL_ID, "NEXT_PUBLIC_DUMMY_CREDENTIAL_ID is not set");

  const credential = useFetchCredential(CREDENTIAL_ID);
  const [reusableCredential, setReusableCredential] = useState<idOSCredential | null>();

  const idOS = useIdOS();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isPending, startTransition] = useTransition();

  const handleCredentialDuplicateProcess = () => {
    startTransition(async () => {
      if (!credential.data) return;

      const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.data.id);
      const lockedUntil = 0;

      const granteeSigningPublicKey = process.env.NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY;
      const granteeEncryptionPublicKey = process.env.NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY;

      invariant(granteeSigningPublicKey, "NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY is not set");
      invariant(granteeEncryptionPublicKey, "NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY is not set");

      const { id } = await idOS.data.shareCredential(
        credential.data.id,
        granteeEncryptionPublicKey,
        {
          granteeAddress: granteeSigningPublicKey,
          lockedUntil: 0,
        },
      );

      // Create the DAG payload
      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: granteeSigningPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      // Request a message to sign that will be used in the DAG payload
      const message: string = await idOS.data.requestDAGSignature(dag);

      // Sign the message
      const signature = await signMessageAsync({ message });

      const result = await invokePassportingService({
        ...dag,
        dag_signature: signature,
      });

      setReusableCredential(result);
    });
  };

  if (reusableCredential) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-semibold text-2xl">
          You have successfully shared your credential with us!
        </h3>
        <CredentialCard credential={reusableCredential} />
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
      <Button onPress={handleCredentialDuplicateProcess} isLoading={isPending}>
        {isPending ? "Requesting credential duplicate..." : "Request credential duplicate"}
      </Button>
    </div>
  );
}
