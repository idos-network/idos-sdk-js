import { CreditCard } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "~/components/ui/number-field";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useUser } from "~/layouts/app";
import { COMMON_ENV } from "~/providers/envFlags.common";
import { MachineContext } from "~/providers/state";
import type { Route } from "./+types/add";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

const loadingMessages: Record<string, string> = {
  findCredential: "Finding credential...",
  requestAccessGrant: "Requesting access grant...",
  waitForCredential: "Waiting for credential verification...",
  login: "Logging in...",
  error: "An error occurred",
  requestKrakenDAG: "Requesting access grant for KYC provider...",
  createToken: "Creating a sharable token for provider...",
  checkCredentialStatus: "Waiting for KYC approval from Transak...",
  waitForCredentialStatus: "Waiting for KYC approval from Transak...",
  fetchWidgetUrl: "Loading Transak widget...",
};

export default function AddFunds() {
  const { address } = useUser();
  const { send } = MachineContext.useActorRef();

  const state = MachineContext.useSelector((s) => s.value);
  const provider = MachineContext.useSelector((s) => s.context.provider);
  const kycUrl = MachineContext.useSelector((s) => s.context.kycUrl);
  const transakWidgetUrl = MachineContext.useSelector((s) => s.context.transakWidgetUrl);
  const errorMessage = MachineContext.useSelector((s) => s.context.errorMessage);
  const dueTosLinks = MachineContext.useSelector((s) => s.context.dueTosLinks);
  const dueKycLink = MachineContext.useSelector((s) => s.context.dueKycLink);

  const messageReceiver = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: message event type
    (message: any) => {
      // KYC iframe messages
      if (message.origin.replace(/\/$/, "") === COMMON_ENV.KRAKEN_API_URL.replace(/\/$/, "")) {
        if (message.data.error) {
          console.error(message.data.error);
        } else if (message.data.open) {
          window.open(message.data.open, message.data.target, message.data.features);
        } else if (message.data.response) {
          send({ type: "kycCompleted" });
        }
      }

      // Transak iframe messages
      if (message?.data?.event_id === "TRANSAK_ORDER_SUCCESSFUL") {
        send({ type: "revokeAccessGrant" });
      }

      if (message?.data?.event_id === "TRANSAK_WIDGET_CLOSE") {
        send({ type: "revokeAccessGrant" });
      }
    },
    [send],
  );

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    return () => window.removeEventListener("message", messageReceiver);
  }, [messageReceiver]);

  const handleStart = () => {
    send({ type: "RESET" });
    send({ type: "configure", provider: "transak", address });
  };

  const handleStartDue = () => {
    send({ type: "RESET" });
    send({ type: "configure", provider: "due", address });
  };

  console.log(state);

  // --- Auto-select Persona for KYC ---
  useEffect(() => {
    if (state === "chooseKYCType") {
      send({ type: "startKYC", kycType: "persona" });
    }
  }, [state, send]);

  // --- KYC iframe ---
  if (state === "waitForKYC" && kycUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Funds</h2>
            <p className="text-sm text-muted-foreground">Complete your identity verification</p>
          </div>
        </div>

        <Card className="mx-auto max-w-4xl shadow-sm">
          <CardContent className="p-0">
            <iframe
              src={kycUrl}
              width="100%"
              height="700px"
              title="KYC"
              className="rounded-2xl"
              sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
              allow="camera; microphone; geolocation; clipboard-write"
            />
          </CardContent>
        </Card>

        <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
      </div>
    );
  }

  // --- Transak widget ---
  if (state === "dataOrTokenFetched" && transakWidgetUrl && provider === "transak") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Funds</h2>
            <p className="text-sm text-muted-foreground">Complete your purchase</p>
          </div>
        </div>

        <Card className="mx-auto max-w-xl overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <iframe
              id="transakIframe"
              src={transakWidgetUrl}
              allow="camera;microphone;payment"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-[70dvh] w-full border-none"
              title="Transak"
            />
          </CardContent>
        </Card>

        <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
      </div>
    );
  }

  // Due TOS?!
  if (typeof state === "object" && "dueFlow" in state && state.dueFlow === "acceptTosWaiting") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Funds</h2>
            <p className="text-sm text-muted-foreground">Complete your purchase</p>
          </div>
        </div>
        Here are the links: {dueTosLinks?.tos} and {dueTosLinks?.privacyPolicy}
        <button type="button" onClick={() => send({ type: "acceptTos" })}>
          Accept TOS
        </button>
      </div>
    );
  }

  // Due KYC iframe
  if (
    typeof state === "object" &&
    "dueFlow" in state &&
    (state.dueFlow === "checkKycStatus" || state.dueFlow === "waitForKycToBeDone") &&
    dueKycLink
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Finish your KYC</h2>
          </div>
        </div>

        <iframe
          src={dueKycLink}
          width="100%"
          height="700px"
          title="KYC"
          className="rounded-2xl"
          sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
          allow="camera; microphone; geolocation; clipboard-write"
        />
      </div>
    );
  }

  // --- Loading / intermediate states ---
  const stateKey = state as string;

  // Handle createSharableToken sub-states
  // @ts-expect-error Missing substates?
  const subState = state.createSharableToken as string | undefined;

  const message = loadingMessages[stateKey] ?? (subState ? loadingMessages[subState] : null);

  if (message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Funds</h2>
            <p className="text-sm text-muted-foreground">Processing your request</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
          {errorMessage && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}
        </div>

        <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
      </div>
    );
  }

  // --- Default: form (notConfigured) ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Funds</h2>
          <p className="text-sm text-muted-foreground">
            Buy crypto with your credit card or bank transfer
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Buy Stablecoins</CardTitle>
          <CardDescription>Select amount and currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>I want to spend</Label>
            <div className="flex gap-2">
              <NumberField defaultValue={100} className="flex-1">
                <NumberFieldGroup>
                  <NumberFieldInput className="text-left text-lg" />
                </NumberFieldGroup>
              </NumberField>
              <Select defaultValue="USD">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm overflow-hidden p-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Transak</div>
                  <div className="text-xs text-muted-foreground">
                    Global cards &amp; bank transfers
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">&asymp; 100 USDC</div>
                <div className="text-xs font-medium text-success-foreground">Best rate</div>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleStart}>
            Continue with Transak
          </Button>
          <Button className="w-full" size="lg" onClick={handleStartDue}>
            Continue with Due
          </Button>
        </CardContent>
      </Card>

      <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
    </div>
  );
}
