import { defineStepper } from "@stepperize/react";

export const { Scoped, useStepper } = defineStepper(
  { id: "token-select" },
  { id: "checkout" },
  { id: "checkout-summary" },
  { id: "noah-onboarding" },
  { id: "noah-verification-pending" },
  { id: "transaction-pending" },
  { id: "transaction-completed" },
);
