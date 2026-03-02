import { useCheckout } from "~/contexts/checkout-context";
import { AchFormFields } from "../payment-methods/ach";
import { FedwireFormFields } from "../payment-methods/fedwire";
import { BankLocalFormFields } from "../payment-methods/local/form";
import { PixFormFields } from "../payment-methods/pix";
import { SepaFormFields } from "../payment-methods/sepa";

export function CheckoutFormFields() {
  const { country, paymentMethod } = useCheckout();

  if (!(paymentMethod || country)) {
    return null;
  }

  switch (paymentMethod) {
    case "BankSepa":
      return <SepaFormFields />;
    case "IdentifierPix":
      return <PixFormFields />;
    case "BankLocal":
      return <BankLocalFormFields />;
    case "BankFedwire":
      return <FedwireFormFields />;
    case "BankAch":
      return <AchFormFields />;
    default:
      return null;
  }
}
