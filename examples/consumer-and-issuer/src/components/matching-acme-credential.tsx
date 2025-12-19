"use client";

import { Button, Link, Spinner } from "@heroui/react";
import type { idOSPassportingPeer } from "@idos-network/core/kwil-actions";
import type { idOSCredential } from "@idos-network/credentials/types";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import invariant from "tiny-invariant";
import { useSignMessage } from "wagmi";
import { invokePassportingService } from "@/actions";
import { useIsleController } from "@/isle.provider";
import { CredentialCard } from "./credential-card";

const WIP = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-white">
      <Spinner size="lg" />
      <p className="text-sm">We are working on it! Please wait a moment and try again.</p>
    </div>
  );
};

const useFetchMatchingCredential = () => {
  const { isleController } = useIsleController();

  return useQuery<
    { credentials: idOSCredential[]; peers: idOSPassportingPeer[] },
    Error,
    (idOSCredential & { passporting_server_url_base: string }) | null
  >({
    queryKey: ["matching-credential"],
    queryFn: async () => {
      invariant(isleController?.idosClient.state === "logged-in");
      const [credentials, peers] = await Promise.all([
        isleController?.idosClient.getAllCredentials(),
        fetch("/api/passporting-peers").then((res) => res.json()) as Promise<idOSPassportingPeer[]>,
      ]);
      return { credentials, peers };
    },
    select: (data) => {
      const matchingCredential = data.credentials.find((credential: idOSCredential) => {
        const publicNotes = credential.public_notes ? JSON.parse(credential.public_notes) : {};
        return publicNotes.type === "KYC DATA";
      });

      if (!matchingCredential) {
        return null;
      }

      const matchingPeer = data.peers.find(
        (peer: idOSPassportingPeer) =>
          peer.issuer_public_key === matchingCredential.issuer_auth_public_key,
      );

      if (!matchingPeer) {
        return null;
      }

      return {
        ...matchingCredential,
        passporting_server_url_base: matchingPeer.passporting_server_url_base,
      };
    },
    enabled: isleController?.idosClient.state === "logged-in",
  });
};

export const useFetchSharedCredentialFromUser = () => {
  const { isleController } = useIsleController();

  return useQuery<{ credential: idOSCredential | null; cause: string }>({
    queryKey: ["shared-credential"],
    queryFn: async () => {
      invariant(isleController?.idosClient.state === "logged-in");
      const res = await fetch(`/api/shared-credential/${isleController?.idosClient.user.id}`);
      return (await res.json()) as { credential: idOSCredential | null; cause: string };
    },
    enabled: isleController?.idosClient.state === "logged-in",
  });
};

function useShareCredential() {
  const { address } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const { isleController } = useIsleController();

  return useMutation({
    mutationFn: async (
      matchingCredential: idOSCredential & { passporting_server_url_base: string },
    ) => {
      invariant(isleController?.idosClient.state === "logged-in");

      const contentHash = await isleController?.idosClient.getCredentialContentSha256Hash(
        matchingCredential.id,
      );
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

      const { id } = await isleController.idosClient.createCredentialCopy(
        matchingCredential.id,
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

      const message: string = await isleController?.idosClient.requestDAGMessage(dag);
      const signature = await signMessageAsync({ message });

      return invokePassportingService(
        `${matchingCredential.passporting_server_url_base}/passporting-registry`,
        {
          ...dag,
          dag_signature: signature,
        },
      );
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["shared-credential"] });
    },
  });
}

export function MatchingCredential() {
  const { isleController } = useIsleController();
  const matchingCredential = useFetchMatchingCredential();
  const sharedCredentialFromUser = useFetchSharedCredentialFromUser();
  const shareCredential = useShareCredential();

  const handleCredentialDuplicateProcess = () => {
    if (!matchingCredential.data) return;

    shareCredential.mutate(matchingCredential.data);
  };

  if (matchingCredential.isPending || sharedCredentialFromUser.isPending) {
    return <WIP />;
  }

  if (isleController?.idosClient.state === "with-user-signer") {
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL ?? "https://issuer.idos.network";
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
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL ?? "https://issuer.idos.network";
    invariant(issuerUrl, "NEXT_PUBLIC_ISSUER_URL is not set");

    return (
      <div className="flex flex-col items-center gap-4 text-white">
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
        <Image
          src="/static/acme-card-success.jpg"
          alt="ACME Card"
          width={240}
          height={240}
          className="h-auto w-full rounded-[24px]"
        />
        <h3 className="font-semibold text-2xl text-white">
          You have successfully shared your credential with us!
        </h3>
        <CredentialCard credential={sharedCredentialFromUser.data?.credential} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold text-2xl text-white">
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
