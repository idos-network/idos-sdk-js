import { LogOutIcon, ShieldUserIcon, SmilePlusIcon } from "lucide-react";
import { Outlet } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { useActorRef, useSelector } from "@/machines/dashboard/provider";
import {
  selectError,
  selectIsConnectingFaceSign,
  selectIsCreatingProfile,
  selectIsDisconnected,
  selectIsError,
  selectIsLoading,
  selectIsNoProfile,
  selectLoggedInClient,
} from "@/machines/dashboard/selectors";

export default function AppLayout() {
  const { send } = useActorRef();
  const isLoading = useSelector(selectIsLoading);
  const isConnectingFaceSign = useSelector(selectIsConnectingFaceSign);
  const isCreatingProfile = useSelector(selectIsCreatingProfile);
  const isDisconnected = useSelector(selectIsDisconnected);
  const isNoProfile = useSelector(selectIsNoProfile);
  const isError = useSelector(selectIsError);
  const error = useSelector(selectError);
  const idOSClient = useSelector(selectLoggedInClient);

  if (isError) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <p className="text-destructive max-w-md text-center text-lg">
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

  if (isLoading || isConnectingFaceSign || isCreatingProfile) {
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
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <div className="bg-card relative w-full max-w-2xl overflow-hidden rounded-3xl border p-8 shadow-sm lg:p-10">
          <div className="from-primary/12 via-primary/4 pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b to-transparent" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6">
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
            </div>

            <div className="bg-primary/10 text-primary mb-5 flex size-16 items-center justify-center rounded-2xl border">
              <ShieldUserIcon size={28} />
            </div>

            <div className="max-w-xl space-y-3">
              <p className="text-primary text-xs font-semibold tracking-[0.24em] uppercase">
                Account setup needed
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                No idOS account found for this connected wallet
              </h1>
              <p className="text-muted-foreground text-base leading-7 text-pretty">
                Your wallet is connected, but it does not have an idOS account yet. Create one to
                continue to the dashboard and start working with your data and developer tools.
              </p>
            </div>

            <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
              <Button
                size="xl"
                onClick={() => send({ type: "CREATE_PROFILE" })}
                className="flex-1 gap-2 rounded-xl"
              >
                <SmilePlusIcon size={20} />
                Create idOS account
              </Button>
              <Button
                size="xl"
                variant="secondary"
                onClick={() => send({ type: "DISCONNECT" })}
                className="flex-1 gap-2 rounded-xl"
              >
                <LogOutIcon size={20} />
                Disconnect wallet
              </Button>
            </div>
          </div>
        </div>
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
