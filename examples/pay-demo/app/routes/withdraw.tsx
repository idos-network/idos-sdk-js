import { Landmark } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "~/components/ui/number-field";
import { DueKyc } from "~/components/withdraw/due-kyc";
import { FlowError } from "~/components/withdraw/flow-error";
import { FlowSuccess } from "~/components/withdraw/flow-success";
import { QuoteDisplay } from "~/components/withdraw/quote-display";
import { RecipientForm, type SepaRecipient } from "~/components/withdraw/recipient-form";
import { DueTos } from "~/components/withdraw/tos";
import { TransferConfirm } from "~/components/withdraw/transfer-confirm";
import { TransferStatusTracker } from "~/components/withdraw/transfer-status";
import { useUser } from "~/layouts/app";
import {
  CURRENCY_SYMBOLS,
  DEMO_FX_RATE,
  DEMO_SOURCE_FEE,
  DESTINATION_CURRENCY,
  SOURCE_CURRENCY,
} from "~/lib/constants";
import { userContext } from "~/middlewares/auth.server";
import { COMMON_ENV } from "~/providers/envFlags.common";
import { MachineContext } from "~/providers/state";
import type { Route } from "./+types/withdraw";

type TransferStep = "recipient" | "quote" | "confirm" | "signing" | "status" | "done";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const userData = context.get(userContext);
  return { userData };
}

export default function Withdraw({ loaderData }: Route.ComponentProps) {
  const { userData } = loaderData;

  const { address } = useUser();
  const { send } = MachineContext.useActorRef();

  const state = MachineContext.useSelector((s) => s.value);
  const provider = MachineContext.useSelector((s) => s.context.provider);
  const meta = MachineContext.useSelector((s) => s.getMeta());
  const kycUrl = MachineContext.useSelector((s) => s.context.kycUrl);
  const errorMessage = MachineContext.useSelector((s) => s.context.errorMessage);
  const dueTosLinks = MachineContext.useSelector((s) => s.context.dueTosLinks);
  const dueKycLink = MachineContext.useSelector((s) => s.context.dueKycLink);
  const dueKycStatus = MachineContext.useSelector((s) => s.context.dueKycStatus);

  const destinationCurrencySymbol = CURRENCY_SYMBOLS[DESTINATION_CURRENCY] ?? DESTINATION_CURRENCY;

  console.log("state: ", state);

  // --- Local state for the demo transfer flow ---
  const [transferStep, setTransferStep] = useState<TransferStep>("recipient");
  const [signingWallet, setSigningWallet] = useState(false);
  const [recipient, setRecipient] = useState<SepaRecipient | null>(null);
  const [sourceAmount, setSourceAmount] = useState(100);
  const [transferStatus, setTransferStatus] = useState<
    "awaiting_funds" | "processing" | "completed"
  >("awaiting_funds");
  const [quoteExpiry, setQuoteExpiry] = useState(() =>
    new Date(Date.now() + 2 * 60 * 1000).toISOString(),
  );

  const normalizedSourceAmount =
    Number.isFinite(sourceAmount) && sourceAmount > 0 ? sourceAmount : 0;
  const netSourceAmount = Math.max(0, normalizedSourceAmount - DEMO_SOURCE_FEE);
  const destinationAmount = netSourceAmount * DEMO_FX_RATE;
  const formattedSourceAmount = netSourceAmount.toFixed(2);
  const formattedDestinationAmount = destinationAmount.toFixed(2);

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
    if (typeof state === "object" && "kycFlow" in state && state.kycFlow === "chooseType") {
      send({ type: "start", kycType: "persona" });
    }
  }, [state, send]);

  // --- Simulated signing & status progression ---
  useEffect(() => {
    if (transferStep === "signing") {
      const timer = setTimeout(() => {
        setTransferStatus("processing");
        setTransferStep("status");
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (transferStep === "status" && transferStatus === "processing") {
      const timer = setTimeout(() => {
        setTransferStatus("completed");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transferStep, transferStatus]);

  // --- KYC iframe (Kraken/Persona identity verification) ---
  if (typeof state === "object" && "kycFlow" in state && state.kycFlow === "waitForKYC" && kycUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
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

  // -- Due Flow --
  if (typeof state === "object" && "dueFlow" in state) {
    if (state.dueFlow === "showTos") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
              <p className="text-muted-foreground text-sm">
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
    if (dueKycLink && dueKycStatus === "resubmission_required") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
              <p className="text-muted-foreground text-sm">
                Complete your verification through Due
              </p>
            </div>
          </div>

          <DueKyc kycUrl={dueKycLink} />

          <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
        </div>
      );
    }

    // --- Due transfer flow (after KYC is done) ---
    if (state.dueFlow === "dueFlowDone") {
      // Error during the Due flow
      if (errorMessage) {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-2xl text-foreground tracking-tight">
                  Withdraw Funds
                </h2>
                <p className="text-muted-foreground text-sm">An error occurred</p>
              </div>
            </div>

            <FlowError message={errorMessage} onRetry={handleStartDue} />

            <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
          </div>
        );
      }

      if (dueKycStatus === "pending") {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-2xl text-foreground tracking-tight">
                  Withdraw Funds
                </h2>
                <p className="text-muted-foreground text-sm">KYC is in progress, please wait...</p>
              </div>
            </div>
          </div>
        );
      }

      if (dueKycStatus === "failed") {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-2xl text-foreground tracking-tight">
                  Withdraw Funds
                </h2>
                <p className="text-muted-foreground text-sm">KYC has failed...</p>
              </div>
            </div>
          </div>
        );
      }

      const recipientName =
        recipient?.accountType === "individual"
          ? `${recipient.firstName} ${recipient.lastName}`
          : (recipient?.companyName ?? "");

      switch (transferStep) {
        case "recipient":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    Withdraw Funds
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your bank account details to receive funds
                  </p>
                </div>
              </div>

              <RecipientForm
                onSubmit={(data) => {
                  setRecipient(data);
                  setQuoteExpiry(new Date(Date.now() + 2 * 60 * 1000).toISOString());
                  setTransferStep("quote");
                }}
              />

              <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
            </div>
          );

        case "quote":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    Withdraw Funds
                  </h2>
                  <p className="text-muted-foreground text-sm">Review your transfer details</p>
                </div>
              </div>

              <QuoteDisplay
                source={{
                  currency: SOURCE_CURRENCY,
                  amount: formattedSourceAmount,
                  fee: DEMO_SOURCE_FEE.toFixed(2),
                }}
                destination={{
                  currency: DESTINATION_CURRENCY,
                  amount: formattedDestinationAmount,
                  fee: "0.00",
                }}
                fxRate={DEMO_FX_RATE}
                expiresAt={quoteExpiry}
                onConfirm={() => setTransferStep("confirm")}
                onCancel={() => setTransferStep("recipient")}
                onRefresh={() => setQuoteExpiry(new Date(Date.now() + 2 * 60 * 1000).toISOString())}
              />

              <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
            </div>
          );

        case "confirm":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    Withdraw Funds
                  </h2>
                  <p className="text-muted-foreground text-sm">Confirm and sign the transaction</p>
                </div>
              </div>

              <TransferConfirm
                source={{ currency: SOURCE_CURRENCY, amount: formattedSourceAmount }}
                destination={{ currency: DESTINATION_CURRENCY, amount: formattedDestinationAmount }}
                recipientName={recipientName}
                recipientIban={recipient?.iban ?? ""}
                isLoading={signingWallet}
                onSign={async () => {
                  try {
                    setSigningWallet(true);
                    const message = [
                      "Due Transfer Authorization",
                      "",
                      `Send: ${formattedSourceAmount} ${SOURCE_CURRENCY}`,
                      `Receive: ${formattedDestinationAmount} ${DESTINATION_CURRENCY}`,
                      `Recipient: ${recipientName}`,
                      `IBAN: ${recipient?.iban ?? ""}`,
                      `Date: ${new Date().toISOString()}`,
                    ].join("\n");

                    await window.ethereum?.request({
                      method: "personal_sign",
                      params: [message, address],
                    });

                    setTransferStep("signing");
                    setTransferStatus("awaiting_funds");
                  } catch (err) {
                    console.error("Signature rejected:", err);
                  } finally {
                    setSigningWallet(false);
                  }
                }}
              />

              <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
            </div>
          );

        case "signing":
        case "status":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    Withdraw Funds
                  </h2>
                  <p className="text-muted-foreground text-sm">Transfer in progress</p>
                </div>
              </div>

              <TransferStatusTracker
                status={transferStatus}
                source={{ currency: SOURCE_CURRENCY, amount: formattedSourceAmount }}
                destination={{ currency: DESTINATION_CURRENCY, amount: formattedDestinationAmount }}
                recipientName={recipientName}
                onDone={() => setTransferStep("done")}
              />

              <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
            </div>
          );

        case "done":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    Withdraw Funds
                  </h2>
                  <p className="text-muted-foreground text-sm">Transfer complete</p>
                </div>
              </div>

              <FlowSuccess
                title="Transfer Complete"
                message={`${formattedDestinationAmount} ${DESTINATION_CURRENCY} has been sent to ${recipientName}. The funds should arrive in your bank account shortly.`}
              />

              <div id="idOS-enclave" className={provider ? "mx-auto block w-fit" : "hidden"} />
            </div>
          );
      }
    }
  }

  // --- Top-level error ---
  if (
    state === "error" ||
    (typeof state === "object" && "dueFlow" in state && state.dueFlow === "error")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
            <p className="text-muted-foreground text-sm">An error occurred</p>
          </div>
        </div>

        <FlowError message={errorMessage ?? undefined} onRetry={handleStartDue} />

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
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
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

  if (userData && userData.due?.kycStatus === "pending") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
            <p className="text-muted-foreground text-sm">KYC is in progress, please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (userData && userData.due?.kycStatus === "failed") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
            <p className="text-muted-foreground text-sm">KYC has failed...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Default: form (notConfigured) ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-foreground tracking-tight">Withdraw Funds</h2>
          <p className="text-muted-foreground text-sm">
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
              <NumberField
                defaultValue={100}
                className="flex-1"
                onValueChange={(value) => {
                  setSourceAmount(typeof value === "number" && Number.isFinite(value) ? value : 0);
                }}
              >
                <NumberFieldGroup>
                  <NumberFieldInput className="text-left text-lg" />
                </NumberFieldGroup>
              </NumberField>
              <div className="flex items-center justify-center rounded-md border border-input bg-muted px-4 font-medium text-sm">
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
                  <div className="text-muted-foreground text-xs">SEPA Instant Transfer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  &asymp; {destinationCurrencySymbol}
                  {formattedDestinationAmount}
                </div>
                <div className="font-medium text-success-foreground text-xs">
                  Rate: 1 {SOURCE_CURRENCY} = {destinationCurrencySymbol}
                  {DEMO_FX_RATE.toFixed(2)}
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
