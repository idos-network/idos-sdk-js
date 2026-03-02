import { Landmark } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Radio, RadioGroup } from "~/components/ui/radio-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

export interface SepaRecipient {
  accountType: "individual" | "business";
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  IBAN: string;
}

export interface AchRecipient {
  accountType: "individual" | "business";
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  bankName: string; // Required per Due API documentation
  accountName?: string; // Optional per Due API documentation
  accountNumber: string;
  routingNumber: string;
  beneficiaryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string; // Optional per Due API documentation
    postalCode: string;
    country: string;
  };
}

export type Recipient = (SepaRecipient & { type: "sepa" }) | (AchRecipient & { type: "ach" });

interface RecipientFormProps {
  onSubmit: (recipient: Recipient) => void;
  isLoading?: boolean;
}

export function RecipientForm({ onSubmit, isLoading = false }: RecipientFormProps) {
  const [bankType, setBankType] = useState<"ach" | "sepa">("sepa");
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");

  // Common fields
  const [firstName, setFirstName] = useState("");
  /* cspell:disable-next-line */
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");

  // SEPA fields
  const [iban, setIban] = useState("");

  // ACH fields
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const isValid =
    bankType === "sepa"
      ? accountType === "individual"
        ? firstName.trim() && lastName.trim() && iban.trim()
        : companyName.trim() && iban.trim()
      : accountType === "individual"
        ? firstName.trim() &&
          lastName.trim() &&
          name.trim() &&
          bankName.trim() &&
          accountNumber.trim() &&
          routingNumber.trim() &&
          line1.trim() &&
          city.trim() &&
          postalCode.trim()
        : companyName.trim() &&
          name.trim() &&
          bankName.trim() &&
          accountNumber.trim() &&
          routingNumber.trim() &&
          line1.trim() &&
          city.trim() &&
          postalCode.trim();

  const handleSubmit = () => {
    if (!isValid) return;

    if (bankType === "sepa") {
      // Build name from firstName+lastName for individual, or companyName for business
      const recipientName =
        accountType === "individual"
          ? `${firstName.trim()} ${lastName.trim()}`
          : companyName.trim();

      const recipient: Recipient = {
        type: "sepa",
        accountType,
        name: recipientName,
        IBAN: iban.trim().replace(/\s/g, "").toUpperCase(),
        ...(accountType === "individual"
          ? { firstName: firstName.trim(), lastName: lastName.trim() }
          : { companyName: companyName.trim() }),
      };
      onSubmit(recipient);
    } else {
      const recipient: Recipient = {
        type: "ach",
        accountType,
        name: name.trim(),
        bankName: bankName.trim(), // Required per Due API
        ...(accountName.trim() && { accountName: accountName.trim() }), // Optional
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim(),
        beneficiaryAddress: {
          line1: line1.trim(),
          ...(line2.trim() && { line2: line2.trim() }),
          city: city.trim(),
          ...(state && { state }),
          postalCode: postalCode.trim(),
          country: "US",
        },
        ...(accountType === "individual"
          ? { firstName: firstName.trim(), lastName: lastName.trim() }
          : { companyName: companyName.trim() }),
      };
      onSubmit(recipient);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl gap-5 shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info-foreground">
          <Landmark className="h-6 w-6" />
        </div>
        <CardTitle>Bank Account Details</CardTitle>
        <CardDescription>Enter your bank account details to receive funds</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <fieldset disabled={isLoading} className="flex flex-col gap-2">
          <Label>Bank type</Label>
          <RadioGroup
            value={bankType}
            onValueChange={(v) => setBankType(v as "ach" | "sepa")}
            className="flex flex-row gap-4"
          >
            <label htmlFor="bank-type-ach" className="flex cursor-pointer items-center gap-2">
              <Radio id="bank-type-ach" value="ach" />
              <span className="text-foreground text-sm">US Bank (ACH)</span>
            </label>
            <label htmlFor="bank-type-sepa" className="flex cursor-pointer items-center gap-2">
              <Radio id="bank-type-sepa" value="sepa" />
              <span className="text-foreground text-sm">SEPA</span>
            </label>
          </RadioGroup>
        </fieldset>

        <fieldset disabled={isLoading} className="flex flex-col gap-2">
          <Label>Account type</Label>
          <RadioGroup
            value={accountType}
            onValueChange={(v) => setAccountType(v as "individual" | "business")}
            className="flex flex-row gap-4"
          >
            <label
              htmlFor="account-type-individual"
              className="flex cursor-pointer items-center gap-2"
            >
              <Radio id="account-type-individual" value="individual" />
              <span className="text-foreground text-sm">Individual</span>
            </label>
            <label
              htmlFor="account-type-business"
              className="flex cursor-pointer items-center gap-2"
            >
              <Radio id="account-type-business" value="business" />
              <span className="text-foreground text-sm">Business</span>
            </label>
          </RadioGroup>
        </fieldset>

        {accountType === "individual" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        {bankType === "sepa" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                placeholder="DE89 3704 0044 0532 0130 00"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bank-name">
                Bank name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bank-name"
                placeholder="Chase Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="account-name">Account name (optional)</Label>
              <Input
                id="account-name"
                placeholder="Checking Account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="account-number">Account number</Label>
                <Input
                  id="account-number"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="routing-number">Routing number</Label>
                <Input
                  id="routing-number"
                  placeholder="021000021"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="line1">Address line 1</Label>
              <Input
                id="line1"
                placeholder="123 Main St"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="line2">Address line 2 (optional)</Label>
              <Input
                id="line2"
                placeholder="Apt 4B"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>State</Label>
                <Select value={state} onValueChange={(v) => setState(v ?? "")} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectPopup>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="postal-code">Postal code</Label>
              <Input
                id="postal-code"
                placeholder="10001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </CardContent>

      <Separator />

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          disabled={!isValid || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
