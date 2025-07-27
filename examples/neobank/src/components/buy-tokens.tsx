import { useRouter } from "next/navigation";
import { useBuyStore } from "@/app/dashboard/buy/store";
import { currencies, TokenAmountInput, tokens } from "@/components/token-amount-input";
import { PaymentMethod } from "./payment-method";
import { Button } from "./ui/button";

export function BuyTokens() {
  const {
    spendAmount,
    setSpendAmount,
    setBuyAmount,
    buyAmount,
    selectedCurrency,
    setSelectedCurrency,
    selectedToken,
    setSelectedToken,
  } = useBuyStore();

  const router = useRouter();

  return (
    <div className="flex max-w-[500px] flex-1 flex-col gap-6 rounded-2xl bg-card p-6">
      <div className="flex flex-col gap-4 border-muted-foreground border-b pb-6">
        <TokenAmountInput
          selectOptions={currencies}
          value={spendAmount}
          onValueChange={setSpendAmount}
          selectedValue={selectedCurrency}
          setSelectedValue={setSelectedCurrency}
          label="I want to spend"
        />
        <TokenAmountInput
          selectOptions={tokens}
          value={buyAmount}
          onValueChange={setBuyAmount}
          selectedValue={selectedToken}
          setSelectedValue={setSelectedToken}
          label="I want to buy"
        />
      </div>

      <PaymentMethod />

      <Button
        disabled={!+spendAmount || !+buyAmount || !selectedCurrency || !selectedToken}
        className="h-12 w-full rounded-full bg-secondary"
        onClick={() => router.push("/pick-kyc-provider")}
      >
        Continue
      </Button>
    </div>
  );
}
