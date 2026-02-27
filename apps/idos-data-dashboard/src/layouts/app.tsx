import { LogOutIcon } from "lucide-react";
import { Outlet, useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { useActorRef, useSelector } from "@/machines/provider";
import {
  selectError,
  selectIsDisconnected,
  selectIsError,
  selectIsLoading,
  selectIsNoProfile,
  selectLoggedInClient,
} from "@/machines/selectors";

export default function AppLayout() {
  const { send } = useActorRef();
  const isLoading = useSelector(selectIsLoading);
  const isDisconnected = useSelector(selectIsDisconnected);
  const isNoProfile = useSelector(selectIsNoProfile);
  const isError = useSelector(selectIsError);
  const error = useSelector(selectError);
  const idOSClient = useSelector(selectLoggedInClient);
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
        <p className="max-w-md text-center text-destructive text-lg">
          {error || "Something went wrong"}
        </p>
        <div className="flex gap-4">
          <Button size="lg" variant="secondary" onClick={() => send({ type: "RETRY" })}>
            Retry
          </Button>
          <Button
            size="lg"
            onClick={() => send({ type: "DISCONNECT" })}
            className="flex items-center gap-2"
          >
            <LogOutIcon size={20} />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || isNavigating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

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
          onClick={() => send({ type: "DISCONNECT" })}
          className="flex items-center gap-2"
        >
          <LogOutIcon size={20} />
          Disconnect wallet
        </Button>
      </div>
    );
  }

  // Sometimes this has been processed during disconnect
  // so we need to stop this in here.
  if (!idOSClient) {
    return null;
  }

  return <Outlet />;
}
