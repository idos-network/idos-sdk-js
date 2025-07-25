import { TokenETH, TokenUSDC, TokenUSDT } from "@web3icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TokenAmountInput } from "@/components/token-amount-input";
import { useAppStore } from "@/stores/app-store";
import { PaymentMethod } from "./payment-method";
import { Button } from "./ui/button";

const CURRENCY_PREFIXES = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const currencyOptions = Object.entries(CURRENCY_PREFIXES).map(([value]) => ({
  value,
  label: value,
}));

const buyOptions = [
  {
    value: "USDC",
    label: "USDC",
    icon: <TokenUSDC />,
  },
  {
    value: "USDT",
    label: "USDT",
    icon: <TokenUSDT />,
  },
  {
    value: "ETH",
    label: "ETH",
    icon: <TokenETH />,
  },
];

export function BuyTokens({
  onCurrencySelected,
}: {
  onCurrencySelected: (value: boolean) => void;
}) {
  const [spendAmount, setSpendAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedBuyToken, setSelectedBuyToken] = useState("");
  const { selectedOnRampProvider } = useAppStore();
  const prefix = CURRENCY_PREFIXES[selectedCurrency as keyof typeof CURRENCY_PREFIXES];

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
          prefix={prefix}
          options={currencyOptions}
        />
        <TokenAmountInput
          spendAmount={spendAmount}
          setSpendAmount={setSpendAmount}
          selectedCurrency={selectedBuyToken}
          setSelectedCurrency={setSelectedBuyToken}
          label="I want to buy"
          options={buyOptions}
        />
      </div>
      <PaymentMethod />
      <Button disabled={!+spendAmount} className="h-12 w-full rounded-full bg-secondary">
        <Link href="/pick-kyc-provider" className="w-full">
          Continue{" "}
          {!!selectedCurrency && selectedOnRampProvider && `with ${selectedOnRampProvider}`}
        </Link>
      </Button>
    </div>
  );
}
