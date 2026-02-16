import { useQuery } from "@tanstack/react-query";
import { useIDOS } from "@/core/idOS";

export function useFetchWallets() {
  const idOSClient = useIDOS();

  return useQuery({
    queryKey: ["wallets"],
    queryFn: () => idOSClient.getWallets(),
    select: (data) => Object.groupBy(data, (wallet) => wallet.address),
  });
}
