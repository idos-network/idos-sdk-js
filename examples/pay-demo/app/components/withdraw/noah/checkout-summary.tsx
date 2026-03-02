import { ChevronLeftIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { useCheckout } from "~/contexts/checkout-context";
import { formatAmount } from "~/lib/utils";

export function CheckoutSummary({
  onConfirm,
  onPrev,
}: {
  onConfirm: () => void;
  onPrev: () => void;
}) {
  const { withdrawAmount, token, formData } = useCheckout();

  // Extract recipient name from form data
  const recipientName = useMemo((): string | null => {
    if (!formData) return null;

    // For Fedwire/ACH: AccountHolderName.Name.FirstName + LastName or Business Name
    if (formData.AccountHolderName?.Name) {
      if (formData.AccountHolderName.Name.FirstName && formData.AccountHolderName.Name.LastName) {
        return `${formData.AccountHolderName.Name.FirstName} ${formData.AccountHolderName.Name.LastName}`;
      }
      if (formData.AccountHolderName.Name) {
        return formData.AccountHolderName.Name; // Business name
      }
    }

    // For PIX: AccountHolderAddress might have name info
    // For SEPA/Local: Usually no name field, just account number
    return null;
  }, [formData]);

  // Extract and mask account number from form data
  const maskedAccount = useMemo((): string | null => {
    if (!formData) return null;

    // Check for AccountNumber at top level (SEPA)
    if (formData.AccountNumber) {
      const accountNumber = formData.AccountNumber.toString();
      if (accountNumber.length >= 4) {
        return `**** ${accountNumber.slice(-4)}`;
      }
      return accountNumber;
    }

    // Check for BankDetails.AccountNumber (Fedwire/ACH/Local)
    if (formData.BankDetails?.AccountNumber) {
      const accountNumber = formData.BankDetails.AccountNumber.toString();
      if (accountNumber.length >= 4) {
        return `**** ${accountNumber.slice(-4)}`;
      }
      return accountNumber;
    }

    return null;
  }, [formData]);

  const tokenSymbol = token.split("_")[0] || token;

  return (
    <Card className="w-full max-w-[526px] gap-5">
      <CardHeader className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <Button onClick={onPrev} size="icon" variant="ghost">
          <ChevronLeftIcon className="size-6" />
        </Button>
        <CardTitle className="text-center font-normal text-lg">Checkout Summary</CardTitle>
        <div className="size-10" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* You're withdrawing section */}
        <div className="flex flex-col justify-center gap-6">
          <div className="flex w-full flex-col justify-center gap-1 text-center">
            <p className="font-medium text-muted-foreground text-xs">You're withdrawing</p>
            <p className="font-medium text-2xl text-foreground">
              <span className="font-medium text-3xl">{formatAmount(withdrawAmount)}</span>
              <span className="px-1 font-medium text-xs">{tokenSymbol}</span>
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="h-px bg-border" />

        {/* Network and Asset Section */}
        <div className="flex h-full items-center gap-10">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <span className="font-bold text-xs">{tokenSymbol}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm">Network</p>
            <p className="font-medium text-foreground">Polygon</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm">Asset</p>
            <p className="font-medium text-foreground">{tokenSymbol}</p>
          </div>
        </div>

        {/* Recipient and payment method */}
        <div aria-hidden="true" className="h-px bg-border" />
        <div className="flex gap-6">
          {recipientName && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">To recipient</p>
              <p className="font-medium text-foreground">{recipientName}</p>
            </div>
          )}
          {maskedAccount && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">Account</p>
              <p className="font-medium text-foreground">{maskedAccount}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-5">
        <Button onClick={onConfirm} size="lg" variant="default">
          Confirm withdrawal
        </Button>
      </CardFooter>
    </Card>
  );
}
