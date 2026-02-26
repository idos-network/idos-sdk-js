import { useSelector } from "@xstate/react";
import { LogOutIcon } from "lucide-react";
import { Outlet, useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { dashboardActor } from "@/machines/dashboard.actor";
import {
  selectError,
  selectIsDisconnected,
  selectIsError,
  selectIsLoading,
  selectIsNoProfile,
  selectLoggedInClient,
} from "@/machines/selectors";

export default function AppLayout() {
  const isLoading = useSelector(dashboardActor, selectIsLoading);
  const isDisconnected = useSelector(dashboardActor, selectIsDisconnected);
  const isNoProfile = useSelector(dashboardActor, selectIsNoProfile);
  const isError = useSelector(dashboardActor, selectIsError);
  const error = useSelector(dashboardActor, selectError);
  const idOSClient = useSelector(dashboardActor, selectLoggedInClient);
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  if (isLoading || isNavigating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
        <p className="max-w-md text-center text-destructive text-lg">
          {error || "Something went wrong"}
        </p>
        <div className="flex gap-4">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => dashboardActor.send({ type: "RETRY" })}
          >
            Retry
          </Button>
          <Button
            size="lg"
            onClick={() => dashboardActor.send({ type: "DISCONNECT" })}
            className="flex items-center gap-2"
          >
            <LogOutIcon size={20} />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  console.log("isDisconnected", isDisconnected);
  if (isDisconnected) {
    return <ConnectWallet />;
  }

  if (isNoProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
        <img
          src="/logo-light.svg"
          alt="idOS logo"
          width={160}
          height={52}
          className="h-auto w-40 dark:hidden"
        />
        <img
          src="/logo.svg"
          alt="idOS logo"
          width={160}
          height={52}
          className="hidden h-auto w-40 dark:block"
        />
        <p className="text-foreground text-xl">No idOS account found for the connected wallet</p>
        <Button
          size="lg"
          onClick={() => dashboardActor.send({ type: "DISCONNECT" })}
          className="flex items-center gap-2"
        >
          <LogOutIcon size={20} />
          Disconnect wallet
        </Button>
      </div>
    );
  }

  if (!idOSClient) {
    return null;
  }

  return <Outlet />;
}
