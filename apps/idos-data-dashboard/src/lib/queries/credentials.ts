import { base64Decode, utf8Decode } from "@idos-network/utils/codecs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { idOSCredentialWithShares } from "@/components/credentials/types";
import { useIDOS } from "@/core/idOS";

export function useFetchCredentials() {
  const idOSClient = useIDOS();

  return useQuery({
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

export function useFetchCredentialDetails({ credentialId }: { credentialId: string }) {
  const idOSClient = useIDOS();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: async ({ queryKey: [, credentialId] }) => {
      const credential = await idOSClient.getCredentialById(credentialId);

      await idOSClient.enclaveProvider.ensureUserEncryptionProfile();

      if (!credential) {
        throw new Error(`"idOSCredential" with id ${credentialId} not found`);
      }

      const decryptedContent = await idOSClient.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      );

      Object.assign(credential, { content: utf8Decode(decryptedContent) });

      return credential;
    },
    enabled: idOSClient.state === "logged-in",
  });
}

export function useFetchGrants({ credentialId }: { credentialId: string }) {
  const idOSClient = useIDOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => {
      return idOSClient.getAccessGrantsOwned();
    },
    retry: 1,
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.data_id));
    },
  });
}
