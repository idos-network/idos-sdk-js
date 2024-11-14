import { useIdOS } from "@/idOS.provider";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { skipToken, useQuery } from "@tanstack/react-query";

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();
  return useQuery({
    queryKey: ["credential-details", id],
    queryFn: id ? () => idOS.data.getShared<idOSCredential>("credentials", id, false) : skipToken,
  });
};
export default useFetchCredential;
