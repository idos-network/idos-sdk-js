import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getIdOSClient } from "@/core/idOS";

export function walletsQueryOptions() {
  return queryOptions({
    queryKey: ["wallets"],
    queryFn: () => {
      const idOSClient = getIdOSClient();
      return idOSClient.getWallets();
    },
    select: (data) => Object.groupBy(data, (wallet) => wallet.address),
  });
}

export function useFetchWallets() {
  return useSuspenseQuery(walletsQueryOptions());
}
