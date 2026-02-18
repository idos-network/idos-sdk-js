import type { idOSGrant } from "@idos-network/kwil-infra/actions";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIDOS } from "@/core/idOS";

export function useDeleteCredentialMutation() {
  const idOSClient = useIDOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, DefaultError, { id: string }>({
    mutationFn: async ({ id }) => {
      await idOSClient.removeCredential(id);
      return { id };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["credentials"] }),
  });
}

export function useRevokeGrant() {
  const idOSClient = useIDOS();
  const queryClient = useQueryClient();

  return useMutation<string, Error, idOSGrant>({
    mutationFn: async (grant: idOSGrant) => {
      await idOSClient.revokeAccessGrant(grant.id);
      return grant.id;
    },
    mutationKey: ["revokeGrant"],
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grants"] }),
  });
}

export function useRevokeGrants() {
  const revokeGrant = useRevokeGrant();

  return useMutation({
    mutationFn: async (grants: idOSGrant[]) => {
      const results = await Promise.allSettled(
        grants.map((grant) => revokeGrant.mutateAsync(grant)),
      );

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

      if (failures.length > 0) {
        throw new Error(`Failed to revoke ${failures.length} of ${grants.length} grants`);
      }
    },
    mutationKey: ["revokeGrants"],
  });
}
