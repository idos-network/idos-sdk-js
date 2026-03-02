import { CheckoutProvider } from "~/contexts/checkout-context";
import { FlowSuccess } from "../flow-success";
import { CheckoutStep } from "./checkout-step";
import { CheckoutSummary } from "./checkout-summary";
import { OnboardingStep } from "./onboarding-step";
import { Scoped, useStepper } from "./stepper-config";
import { TokenSelectStep } from "./token-select-step";
import { TransactionStatus, useTransactionActions } from "./transaction-status";
import { VerificationPendingStep } from "./verification-pending-step";

function StepperContent() {
  const stepper = useStepper();
  const transactionActions = useTransactionActions();

  return (
    <>
      {stepper.switch({
        "token-select": () => <TokenSelectStep />,
        checkout: () => <CheckoutStep />,
        "checkout-summary": () => (
          <CheckoutSummary
            onConfirm={() => stepper.goTo("noah-onboarding")}
            onPrev={() => stepper.goTo("checkout")}
          />
        ),
        "noah-onboarding": () => <OnboardingStep />,
        "noah-verification-pending": () => <VerificationPendingStep />,
        "transaction-pending": () => <TransactionStatus actions={transactionActions} />,
        "transaction-completed": () => (
          <FlowSuccess
            title="Transaction Complete"
            message="Your withdrawal has been successfully submitted. Funds will be transferred to your bank account shortly."
          />
        ),
      })}
    </>
  );
}

export function WithdrawStepper() {
  return (
    <CheckoutProvider>
      <Scoped>
        <StepperContent />
      </Scoped>
    </CheckoutProvider>
  );
}
