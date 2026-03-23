import type { idOSClientLoggedIn } from "@idos-network/client";

import { base64Decode, utf8Decode } from "@idos-network/utils/codecs";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type { SharedGrant, idOSCredentialWithShares } from "@/components/credentials/types";

import { useIDOSClient } from "@/hooks/idOS";

export function credentialsQueryOptions(idOSClient: idOSClientLoggedIn) {
  return queryOptions({
    queryKey: ["credentials"],
    queryFn: async () => {
      const credentials = await idOSClient.getAllCredentials();
      return credentials.map((credential) => ({
        ...credential,
        shares: credentials
          .filter((_credential) => _credential.original_id === credential.id)
          .map((c) => c.id),
      })) as idOSCredentialWithShares[];
    },
    select: (credentials) =>
      credentials.filter((credential) => !credential.original_id && !!credential.public_notes),
  });
}

export function useFetchCredentials() {
  const idOSClient = useIDOSClient();
  return useSuspenseQuery(credentialsQueryOptions(idOSClient));
}

export function useFetchCredentialDetails({ credentialId }: { credentialId: string }) {
  const idOSClient = useIDOSClient();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: async () => {
      const credential = await idOSClient.getCredentialById(credentialId);

      if (!credential) {
        throw new Error(`"idOSCredential" with id ${credentialId} not found`);
      }

      await idOSClient.enclaveProvider.ensureUserEncryptionProfile();

      const decryptedContent = await idOSClient.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      );

      Object.assign(credential, { content: utf8Decode(decryptedContent) });

      return credential;
    },
  });
}

export function useFetchSharedGrants() {
  const idOSClient = useIDOSClient();
  const queryClient = useQueryClient();

  return useSuspenseQuery({
    queryKey: ["grants", "shared"],
    queryFn: async () => {
      const [grants] = await Promise.all([
        idOSClient.getAccessGrantsOwned(),
        queryClient.ensureQueryData(credentialsQueryOptions(idOSClient)),
      ]);

      const allCredentials =
        queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]) ?? [];

      return grants.map<SharedGrant>((grant) => {
        const sharedCopy = allCredentials.find((c) => c.id === grant.data_id);
        const original = sharedCopy?.original_id
          ? allCredentials.find((c) => c.id === sharedCopy.original_id)
          : null;

        const source = original ?? sharedCopy;

        return {
          grant,
          credential: source
            ? {
                id: source.id,
                originalId: original?.id ?? source.id,
                publicNotes: JSON.parse(source.public_notes || "{}"),
              }
            : null,
        };
      });
    },
  });
}

export function useFetchGrants({ credentialId }: { credentialId: string }) {
  const idOSClient = useIDOSClient();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => idOSClient.getAccessGrantsOwned(),
    retry: 1,
    select(grants) {
      if (!credentials || !grants) {
        return [];
      }

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.data_id));
    },
  });
}
