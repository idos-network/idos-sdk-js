import { base64Decode, utf8Decode } from "@idos-network/utils/codecs";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { idOSCredentialWithShares } from "@/components/credentials/types";
import { getIdOSClient } from "@/core/idOS";

export function credentialsQueryOptions() {
  return queryOptions({
    queryKey: ["credentials"],
    queryFn: async () => {
      const idOSClient = getIdOSClient();
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
  return useSuspenseQuery(credentialsQueryOptions());
}

export function useFetchCredentialDetails({ credentialId }: { credentialId: string }) {
  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: async () => {
      const idOSClient = getIdOSClient();
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

export function useFetchGrants({ credentialId }: { credentialId: string }) {
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => {
      const idOSClient = getIdOSClient();
      return idOSClient.getAccessGrantsOwned();
    },
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
