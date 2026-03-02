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

export interface AchRecipient {
  accountType: "individual" | "business";
  name: string;
  firstName?: string; // For individual accounts
  lastName?: string; // For individual accounts
  companyName?: string; // For business accounts
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  beneficiaryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface AchRecipientFormProps {
  onSubmit: (recipient: AchRecipient) => void;
  isLoading?: boolean;
}

export function AchRecipientForm({ onSubmit, isLoading = false }: AchRecipientFormProps) {
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const isValid =
    accountType === "individual"
      ? firstName.trim() &&
        lastName.trim() &&
        accountName.trim() &&
        accountNumber.trim() &&
        routingNumber.trim() &&
        line1.trim() &&
        city.trim() &&
        state &&
        postalCode.trim()
      : companyName.trim() &&
        accountName.trim() &&
        accountNumber.trim() &&
        routingNumber.trim() &&
        line1.trim() &&
        city.trim() &&
        state &&
        postalCode.trim();

  const handleSubmit = () => {
    if (!isValid) return;

    const fullName =
      accountType === "individual"
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : companyName.trim();

    const recipient: AchRecipient = {
      accountType,
      name: fullName,
      ...(accountType === "individual"
        ? { firstName: firstName.trim(), lastName: lastName.trim() }
        : { companyName: companyName.trim() }),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber.trim(),
      beneficiaryAddress: {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state,
        postalCode: postalCode.trim(),
        country: "US",
      },
    };

    onSubmit(recipient);
  };

  return (
    <Card className="mx-auto max-w-2xl gap-5 shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info-foreground">
          <Landmark className="h-6 w-6" />
        </div>
        <CardTitle>Bank Account Details</CardTitle>
        <CardDescription>
          Enter your US bank account details to receive funds via ACH
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-name">Account holder name</Label>
          <Input
            id="account-name"
            placeholder="John Doe"
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
              placeholder="123456789"
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
          <Label htmlFor="line1">Street address</Label>
          <Input
            id="line1"
            placeholder="123 Main St"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
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
          <Label htmlFor="postal-code">ZIP code</Label>
          <Input
            id="postal-code"
            placeholder="10001"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
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
