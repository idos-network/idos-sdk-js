import { useToast } from "@chakra-ui/react";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { useDisconnect } from "wagmi";

import { useIdOS } from "@/idOS.provider";

export default function App() {
  const [searchParams] = useSearchParams();
  const walletToAdd = searchParams.get("add-wallet") || undefined;
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const { disconnectAsync } = useDisconnect();
  const idOSClient = useIdOS();
  const toast = useToast();

  useEffect(() => {
    async function checkProfile() {
      if (walletToAdd && callbackUrl && !idOSClient.user.id) {
        await disconnectAsync();

        toast({
          title: "Profile not found",
          description: "Please connect a wallet with an existing idOS profile.",
          status: "error",
        });
      }
    }

    checkProfile();
  }, [walletToAdd, callbackUrl, idOSClient.user.id, disconnectAsync, toast]);

  return <Outlet />;
}
