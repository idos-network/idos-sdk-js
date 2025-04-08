import { useToast } from "@chakra-ui/react";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { useDisconnect } from "wagmi";

import { useIdOS } from "@/core/idos";

export default function App() {
  const [searchParams] = useSearchParams();
  const walletToAdd = searchParams.get("add-wallet") || undefined;
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const { disconnectAsync } = useDisconnect();
  const { hasProfile } = useIdOS();
  const toast = useToast();

  useEffect(() => {
    async function checkProfile() {
      if (walletToAdd && callbackUrl && !hasProfile) {
        await disconnectAsync();

        toast({
          title: "Profile not found",
          description: "Please connect a wallet with an existing idOS profile.",
          status: "error",
        });
      }
    }

    checkProfile();
  }, [walletToAdd, callbackUrl, hasProfile, disconnectAsync, toast]);

  return <Outlet />;
}
