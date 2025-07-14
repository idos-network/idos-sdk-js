import { BankIcon } from "./icons";

export function PaymentMethod() {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium text-muted text-xs">Payment method</span>
      <div className="rounded-2xl border border-muted-foreground px-4 py-5">
        <div className="flex items-center gap-3">
          <BankIcon />
          <h2 className="font-medium text-lg text-secondary">Bank Transfer (ACH)</h2>
        </div>
      </div>
    </div>
  );
}
