import { ChevronLeftIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckoutButton } from "./checkout-button";
import { CheckoutForm } from "./checkout-form";
import { CheckoutFormFields } from "./checkout-form-fields";
import { useStepper } from "./stepper-config";

export function CheckoutStep() {
  const { prev, next } = useStepper();

  return (
    <CheckoutForm onSubmit={next}>
      <Card className="w-full max-w-md gap-5">
        <CardHeader className="gap-2">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Button onClick={prev} size="icon" variant="ghost">
              <ChevronLeftIcon className="size-6" />
            </Button>
            <CardTitle className="text-center font-normal text-lg">Bank details</CardTitle>
            <div className="size-10" />
          </div>
          <CardDescription className="text-center text-sm">
            Enter your bank account details to send funds.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <CheckoutFormFields />
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-5">
          <CheckoutButton />
        </CardFooter>
      </Card>
    </CheckoutForm>
  );
}
