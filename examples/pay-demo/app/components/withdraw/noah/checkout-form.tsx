import { useCheckout } from "~/contexts/checkout-context";
import { Ach } from "../payment-methods/ach";
import { Fedwire } from "../payment-methods/fedwire";
import { BankLocal } from "../payment-methods/local/form";
import { Pix } from "../payment-methods/pix";
import { Sepa } from "../payment-methods/sepa";

export function CheckoutForm({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  const { country, paymentMethod, setFormData } = useCheckout();

  if (!country) {
    return null;
  }

  // Wrapper to store form data before calling original onSubmit
  const handleSubmit = (data: any) => {
    setFormData(data);
    onSubmit();
  };

  switch (paymentMethod) {
    case "BankSepa":
      return (
        <Sepa countryCode={country.code} onSubmit={handleSubmit}>
          {children}
        </Sepa>
      );
    case "IdentifierPix":
      return <Pix onSubmit={handleSubmit}>{children}</Pix>;
    case "BankLocal": {
      const supportedCountries = ["AR", "CO", "MX"];
      if (!supportedCountries.includes(country.code)) {
        return null;
      }
      return (
        <BankLocal countryCode={country.code as "AR" | "CO" | "MX"} onSubmit={handleSubmit}>
          {children}
        </BankLocal>
      );
    }
    case "BankFedwire":
      return <Fedwire onSubmit={handleSubmit}>{children}</Fedwire>;
    case "BankAch":
      return <Ach onSubmit={handleSubmit}>{children}</Ach>;
    default:
      return null;
  }
}
