import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "~/components/ui/number-field";
import { useCheckout } from "~/contexts/checkout-context";
import { calculateFiatAmount } from "~/lib/utils";
import { CountrySelector } from "./country-selector";
import { useStepper } from "./stepper-config";
import { TransferMethod } from "./transfer-method";

const AVAILABLE_TOKENS = ["USDC0", "USDT0", "POL"] as const;

export function TokenSelectStep() {
  const { next } = useStepper();
  const {
    token,
    country,
    withdrawAmount,
    paymentMethod,
    setToken,
    setWithdrawAmount,
    setFiatAmount,
  } = useCheckout();
  const [channels, setChannels] = useState<any>(null);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // Fetch channels when country/token changes
  useEffect(() => {
    if (!country || !token) {
      setChannels(null);
      return;
    }

    const fetchChannels = async () => {
      try {
        setIsLoadingChannels(true);
        const cryptoCurrency =
          token === "USDC0"
            ? "USDC"
            : token === "USDT0"
              ? "USDT"
              : token === "POL"
                ? "MATIC"
                : token;
        const response = await fetch(
          `/app/noah/channels?${new URLSearchParams({
            countryCode: country.code,
            token: cryptoCurrency,
            fiatCurrency: country.currency,
          })}`,
        );
        if (response.ok) {
          const data = await response.json();
          setChannels(data);

          // Calculate fiat amount from first channel
          if (data.Items?.[0]) {
            const baseRate = Number(data.Items[0].Rate) || 0;
            const totalFee = Number(data.Items[0].Calculated?.TotalFee) || 0;
            const calculatedFiat = calculateFiatAmount(withdrawAmount, baseRate, totalFee);
            setFiatAmount(calculatedFiat);
          }
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchChannels();
  }, [country, token, withdrawAmount, setFiatAmount]);

  const channelData = channels?.Items?.[0];
  const baseRate = Number(channelData?.Rate) || 0;
  const totalFee = Number(channelData?.Calculated?.TotalFee) || 0;
  const calculatedFiatAmount = calculateFiatAmount(withdrawAmount, baseRate, totalFee);

  const isDisabledNext = !(token && withdrawAmount && calculatedFiatAmount && paymentMethod);

  return (
    <Card className="mx-auto w-full max-w-md gap-5">
      <CardHeader className="gap-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="size-10" />
          <CardTitle className="text-center font-normal text-lg">Withdraw tokens</CardTitle>
          <div className="size-10" />
        </div>
        <CardDescription className="text-center text-sm">
          Funds will be transferred securely at the rate provided by NOAH.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <CountrySelector />

          {/* Token Selector */}
          <div className="flex flex-col gap-2">
            <label htmlFor="token-select" className="font-medium text-sm">
              Select Token
            </label>
            <div className="flex gap-2">
              {AVAILABLE_TOKENS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setToken(t)}
                  className={`flex-1 rounded-lg border-2 p-3 text-left transition-colors ${
                    token === t
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/50 hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-medium">{t.split("_")[0]}</div>
                  <div className="text-muted-foreground text-xs">Polygon</div>
                </button>
              ))}
            </div>
          </div>

          <TransferMethod />

          {/* Exchange Input Group */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>You're withdrawing</Label>
              <NumberField
                value={withdrawAmount}
                onValueChange={(value) => {
                  setWithdrawAmount(
                    typeof value === "number" && Number.isFinite(value) ? value : 0,
                  );
                }}
              >
                <NumberFieldGroup>
                  <NumberFieldInput className="text-left text-lg" />
                </NumberFieldGroup>
              </NumberField>
              <div className="text-muted-foreground text-xs">
                {token ? token.split("_")[0] : "Select token"}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 z-10 grid size-9 shrink-0 -translate-x-1/2 -translate-y-1/2 place-content-center items-center rounded-full bg-green-200 dark:bg-green-900">
                <span className="font-semibold text-green-800 text-lg leading-none dark:text-green-300">
                  =
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>You're receiving</Label>
              <div className="rounded-lg border border-input bg-muted/30 p-4">
                <div className="font-medium text-2xl">
                  {isLoadingChannels ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <>
                      {country?.currency || "EUR"} {calculatedFiatAmount.toFixed(2)}
                    </>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {totalFee > 0 ? `Fee: ${totalFee.toFixed(2)}` : "No fee"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-5">
        <Button disabled={isDisabledNext} size="lg" variant="default" onClick={next}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
