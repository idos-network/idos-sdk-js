import { useIdOS } from "@/core/idos";
import type { Grant } from "@idos-network/idos-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { idOSCredentialWithShares } from "../types";

export const useFetchGrants = ({ credentialId }: { credentialId: string }) => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => {
      const { grants } = await sdk.grants.getGrantsOwned();
      return grants;
    },
    retry: 1,
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.dataId));
    },
  });
};

export const useRevokeGrant = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<string | undefined, Error, Grant>({
    mutationFn: ({ id }: Grant) => sdk.grants.revokeGrant(id || ""),
    mutationKey: ["revokeGrant"],
    async onMutate() {
      await queryClient.invalidateQueries({ queryKey: ["grants"] });
    },
  });
};

export const useRevokeGrants = () => {
  const revokeGrant = useRevokeGrant();

  return useMutation({
    mutationFn: async (grants: Grant[]) => {
      for (const grant of grants) {
        await revokeGrant.mutateAsync(grant, { onError() {} });
      }
    },
    mutationKey: ["revokeGrants"],
  });
};
