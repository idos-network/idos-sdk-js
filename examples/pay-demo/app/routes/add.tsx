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

export default function AddFunds() {
  const { address } = useUser();
  const { send } = MachineContext.useActorRef();

  const state = MachineContext.useSelector((s) => s.value);
  const currentState = MachineContext.useSelector((s) => s);
  const meta = MachineContext.useSelector((s) => s.getMeta());
  const provider = MachineContext.useSelector((s) => s.context.provider);
  const kycUrl = MachineContext.useSelector((s) => s.context.kycUrl);
  const transakWidgetUrl = MachineContext.useSelector((s) => s.context.transakWidgetUrl);
  const errorMessage = MachineContext.useSelector((s) => s.context.errorMessage);

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
        // send({ type: "revokeAccessGrant" });
      }

      if (message?.data?.event_id === "TRANSAK_WIDGET_CLOSE") {
        // send({ type: "revokeAccessGrant" });
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

  // --- Auto-select Persona for KYC ---
  useEffect(() => {
    if (typeof state === "object" && "kycFlow" in state && state.kycFlow === "chooseType") {
      send({ type: "startKYC", kycType: "persona" });
    }
  }, [state, send]);

  // --- KYC iframe ---
  if (typeof state === "object" && "kycFlow" in state && state.kycFlow === "waitForKYC" && kycUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Add Funds</h2>
            <p className="text-muted-foreground text-sm">Complete your identity verification</p>
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
  if (
    typeof state === "object" &&
    "transakFlow" in state &&
    state.transakFlow === "transakWidgetUrlFetched" &&
    transakWidgetUrl &&
    provider === "transak"
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Add Funds</h2>
            <p className="text-muted-foreground text-sm">Complete your purchase</p>
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

  // --- Loading / intermediate states ---
  const message = Object.values(meta)[0]?.description ?? null;
  if (message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Add Funds</h2>
            <p className="text-muted-foreground text-sm">Processing your request</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-muted-foreground text-sm">{message}</p>
          {errorMessage && <p className="mt-2 text-destructive text-sm">{errorMessage}</p>}
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
          <h2 className="font-bold text-2xl text-foreground tracking-tight">Add Funds</h2>
          <p className="text-muted-foreground text-sm">
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
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-1 shadow-sm">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Transak</div>
                  <div className="text-muted-foreground text-xs">
                    Global cards &amp; bank transfers
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">&asymp; 100 USDC</div>
                <div className="font-medium text-success-foreground text-xs">Best rate</div>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleStart}>
            Continue with Transak
          </Button>
        </CardContent>
      </Card>

      <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
    </div>
  );
}
