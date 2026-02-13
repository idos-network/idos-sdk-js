import { Landmark } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "~/components/ui/number-field";
import { DueKyc } from "~/components/withdraw/due-kyc";
import { DueTos } from "~/components/withdraw/tos";
import { useUser } from "~/layouts/app";
import { COMMON_ENV } from "~/providers/envFlags.common";
import { MachineContext } from "~/providers/state";
import type { Route } from "./+types/withdraw";

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
  createDueAccount: "Creating your Due account...",
  confirmTosAccepted: "Confirming terms and sharing KYC data...",
};

export default function Withdraw() {
  const { address } = useUser();
  const { send } = MachineContext.useActorRef();

  const state = MachineContext.useSelector((s) => s.value);
  const provider = MachineContext.useSelector((s) => s.context.provider);
  const kycUrl = MachineContext.useSelector((s) => s.context.kycUrl);
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
    },
    [send],
  );

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    return () => window.removeEventListener("message", messageReceiver);
  }, [messageReceiver]);

  const handleStartDue = () => {
    send({ type: "RESET" });
    send({ type: "configure", provider: "due", address });
  };

  // --- Auto-select Persona for KYC ---
  useEffect(() => {
    if (state === "chooseKYCType") {
      send({ type: "startKYC", kycType: "persona" });
    }
  }, [state, send]);

  // --- KYC iframe (Kraken/Persona identity verification) ---
  if (state === "waitForKYC" && kycUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
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

  // --- Due TOS acceptance ---
  if (typeof state === "object" && "dueFlow" in state && state.dueFlow === "acceptTosWaiting") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
            <p className="text-sm text-muted-foreground">
              Accept Due's terms to continue with your withdrawal
            </p>
          </div>
        </div>

        <DueTos
          onAccept={() => send({ type: "acceptTos" })}
          tosUrl={dueTosLinks?.tos}
          privacyPolicyUrl={dueTosLinks?.privacyPolicy}
        />

        <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
      </div>
    );
  }

  // --- Due KYC iframe (fallback when Sumsub sharing is insufficient) ---
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
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
            <p className="text-sm text-muted-foreground">Complete your verification through Due</p>
          </div>
        </div>

        <DueKyc kycUrl={dueKycLink} />

        <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
      </div>
    );
  }

  // --- Loading / intermediate states ---
  const stateKey = state as string;

  // Handle dueFlow sub-states
  // @ts-expect-error Missing substates?
  const dueSubState = state.dueFlow as string | undefined;

  const message = loadingMessages[stateKey] ?? (dueSubState ? loadingMessages[dueSubState] : null);

  if (message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
          <p className="text-sm text-muted-foreground">
            Transfer back to your bank account via Due
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Withdraw to Bank</CardTitle>
          <CardDescription>Enter amount to withdraw</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>You are sending</Label>
            <div className="flex gap-2">
              <NumberField defaultValue={100} className="flex-1">
                <NumberFieldGroup>
                  <NumberFieldInput className="text-left text-lg" />
                </NumberFieldGroup>
              </NumberField>
              <div className="flex items-center justify-center rounded-md border border-input bg-muted px-4 text-sm font-medium">
                USDC
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-1 shadow-sm">
                  <Landmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Due</div>
                  <div className="text-xs text-muted-foreground">SEPA Instant Transfer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">&asymp; &euro;92.00</div>
                <div className="text-xs font-medium text-success-foreground">
                  Rate: 1 USDC = &euro;0.92
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleStartDue}>
            Continue with Due
          </Button>
        </CardContent>
      </Card>

      <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
    </div>
  );
}
