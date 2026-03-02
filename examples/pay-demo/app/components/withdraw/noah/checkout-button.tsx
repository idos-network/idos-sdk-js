import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";

export function CheckoutButton() {
  // Try to get form state from react-hook-form context
  // This will work for all payment method forms
  let formState: { isValid?: boolean } = {};
  try {
    const context = useFormContext();
    formState = context.formState;
  } catch {
    // Not in a form context, button will be enabled
  }

  return (
    <Button disabled={formState.isValid === false} size="lg" type="submit" variant="default">
      Continue
    </Button>
  );
}
