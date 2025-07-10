import Link from "next/link";
import { useEffect, useState } from "react";
import { TokenAmountInput } from "@/components/token-amount-input";
import { PaymentMethod } from "./payment-method";
import { Button } from "./ui/button";

export function BuyTokens({
  onCurrencySelected,
}: {
  onCurrencySelected: (value: boolean) => void;
}) {
  const [spendAmount, setSpendAmount] = useState("0");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  useEffect(() => {
    onCurrencySelected(!!selectedCurrency);
  }, [selectedCurrency, onCurrencySelected]);

  return (
    <div className="flex max-w-[500px] flex-1 flex-col gap-6 rounded-2xl bg-card p-6">
      <div className="flex flex-col gap-4 border-muted-foreground border-b pb-6">
        <TokenAmountInput
          spendAmount={spendAmount}
          setSpendAmount={setSpendAmount}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          label="I want to spend"
        />
        <TokenAmountInput
          spendAmount={spendAmount}
          setSpendAmount={setSpendAmount}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          label="I want to buy"
        />
      </div>
      <PaymentMethod />
      <Link href="/pick-kyc-provider">
        <Button disabled={!+spendAmount} className="h-12 w-full rounded-full bg-secondary">
          Continue
        </Button>
      </Link>
    </div>
  );
}
