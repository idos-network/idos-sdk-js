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

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "NO", name: "Norway" },
  { code: "IS", name: "Iceland" },
  { code: "LI", name: "Liechtenstein" },
] as const;

export interface SepaRecipient {
  accountType: "individual" | "business";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  country: string;
  iban: string;
}

interface RecipientFormProps {
  onSubmit: (recipient: SepaRecipient) => void;
  isLoading?: boolean;
}

export function RecipientForm({ onSubmit, isLoading = false }: RecipientFormProps) {
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [firstName, setFirstName] = useState("");
  /* cspell:disable-next-line */
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [iban, setIban] = useState("");

  const isValid =
    accountType === "individual"
      ? firstName.trim() && lastName.trim() && email.trim() && country && iban.trim()
      : companyName.trim() && email.trim() && country && iban.trim();

  const handleSubmit = () => {
    if (!isValid) return;

    const recipient: SepaRecipient = {
      accountType,
      email: email.trim(),
      country,
      iban: iban.trim().replace(/\s/g, ""),
      ...(accountType === "individual"
        ? { firstName: firstName.trim(), lastName: lastName.trim() }
        : { companyName: companyName.trim() }),
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
        <CardDescription>Enter the SEPA bank account to receive funds</CardDescription>
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Country</Label>
          <Select value={country} onValueChange={(v) => setCountry(v ?? "")} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectPopup>
              {EU_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

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
