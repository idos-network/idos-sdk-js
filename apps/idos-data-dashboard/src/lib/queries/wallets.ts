import type { idOSClientLoggedIn } from "@idos-network/client";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useIDOSClient } from "@/hooks/idOS";

export function walletsQueryOptions(idOSClient: idOSClientLoggedIn) {
  return queryOptions({
    queryKey: ["wallets"],
    queryFn: () => idOSClient.getWallets(),
    select: (data) => Object.groupBy(data, (wallet) => wallet.address),
  });
}

export function useFetchWallets() {
  const idOSClient = useIDOSClient();
  return useSuspenseQuery(walletsQueryOptions(idOSClient));
}
