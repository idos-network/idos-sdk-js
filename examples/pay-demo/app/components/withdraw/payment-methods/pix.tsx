import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const MIN_LENGTH = 3;
const ADDRESS_MAX_LENGTH = 70;
const CITY_MAX_LENGTH = 35;
const STATE_MAX_LENGTH = 35;
const UUID_MIN_LENGTH = 3;
const UUID_MAX_LENGTH = 32;

const PHONE_NUMBER_REGEX = /^\+[0-9]{6,15}$/;
const TAX_ID_REGEX = /^\d{11}$/;

const AccountHolderAddressSchema = z.object({
  Address: z
    .string()
    .min(MIN_LENGTH, "Address must be at least 3 characters")
    .max(ADDRESS_MAX_LENGTH, "Address must not exceed 70 characters"),
  City: z
    .string()
    .min(MIN_LENGTH, "City is required")
    .max(CITY_MAX_LENGTH, "City must not exceed 35 characters"),
  State: z
    .string()
    .min(MIN_LENGTH, "State/Province is required")
    .max(STATE_MAX_LENGTH, "State/Province must not exceed 35 characters"),
});

const IdentifierDetailsSchema = z
  .object({
    IdentifierType: z.enum(["PhoneNumber", "Email", "TaxID", "UUID"], {
      message: "Identifier Type is required",
    }),
    Identifier: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.IdentifierType === "Email") {
        return data.Identifier && z.string().email().safeParse(data.Identifier).success;
      }
      if (data.IdentifierType === "UUID") {
        return (
          data.Identifier &&
          data.Identifier.length >= UUID_MIN_LENGTH &&
          data.Identifier.length <= UUID_MAX_LENGTH
        );
      }
      if (data.IdentifierType === "PhoneNumber") {
        return data.Identifier && PHONE_NUMBER_REGEX.test(data.Identifier);
      }
      if (data.IdentifierType === "TaxID") {
        return data.Identifier && TAX_ID_REGEX.test(data.Identifier);
      }
      return false;
    },
    {
      message: "Invalid identifier format for the selected type",
      path: ["Identifier"],
    },
  );

const PAYMENT_PURPOSE_OPTIONS = [
  "business insurance",
  "family support",
  "education",
  "gift and donation",
  "medical treatment",
  "maintenance expenses",
  "travel",
  "small value remittance",
  "construction expenses",
  "exported goods",
  "service charges",
  "loan payment",
  "property purchase",
  "property rental",
  "shares investment",
  "fund investment",
  "tax payment",
  "personal transfer",
  "salary payment",
  "other fees",
  "other",
  "own account abroad",
  "liberalized remittance",
  "hotel accommodation",
  "advertising expenses",
  "advisory fees",
  "insurance claims",
  "delivery fees",
  "office expenses",
  "royalty fees",
  "transportation fees",
  "utility bills",
] as const;

const PaymentPurposeSchema = z.enum(PAYMENT_PURPOSE_OPTIONS);

export const pixSchema = z.object({
  AccountHolderAddress: AccountHolderAddressSchema,
  TaxID: z.string().regex(TAX_ID_REGEX, "Tax ID (CPF) must be exactly 11 digits"),
  PhoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, "Phone Number must start with + and contain 6-15 digits"),
  PaymentPurpose: PaymentPurposeSchema,
  IdentifierDetails: IdentifierDetailsSchema,
});

export type PixFormSchema = z.infer<typeof pixSchema>;
export type AccountHolderAddress = z.infer<typeof AccountHolderAddressSchema>;
export type IdentifierDetails = z.infer<typeof IdentifierDetailsSchema>;

export type PixProps = {
  children?: React.ReactNode;
  onSubmit: (data: PixFormSchema) => void;
};

export function Pix({ children, onSubmit }: PixProps) {
  const form = useForm<PixFormSchema>({
    resolver: zodResolver(pixSchema),
    mode: "onBlur",
    defaultValues: {
      AccountHolderAddress: {
        Address: "",
        City: "",
        State: "",
      },
      TaxID: "",
      PhoneNumber: "",
      PaymentPurpose: undefined,
      IdentifierDetails: {
        IdentifierType: undefined,
        Identifier: "",
      },
    },
  });

  return (
    <FormProvider {...form}>
      <form className="flex flex-1 place-content-center" onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}

export function PixFormFields() {
  const { control, watch } = useFormContext<PixFormSchema>();
  const identifierType = watch("IdentifierDetails.IdentifierType");

  const getIdentifierPlaceholder = () => {
    if (identifierType === "Email") {
      return "Enter valid email address";
    }
    if (identifierType === "UUID") {
      return "Enter UUID (3-32 characters)";
    }
    if (identifierType === "PhoneNumber") {
      return "Enter phone number (+1234567890)";
    }
    if (identifierType === "TaxID") {
      return "Enter 11-digit CPF";
    }
    return "Enter identifier";
  };

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="AccountHolderAddress.Address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter your address (3-70 characters)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="AccountHolderAddress.City"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Town</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter your town (max 35 characters)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="AccountHolderAddress.State"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State/Province</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter state/province (max 35 characters)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="TaxID"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax ID (CPF)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter 11-digit CPF (e.g., 12345678901)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="PhoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="+1234567890 (6-15 digits)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="PaymentPurpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Purpose</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full capitalize">
                  <SelectValue placeholder="Select payment purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PURPOSE_OPTIONS.map((option) => (
                    <SelectItem className="capitalize" key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="IdentifierDetails.IdentifierType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identifier Type</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select identifier type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PhoneNumber">Phone Number</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="TaxID">Tax ID</SelectItem>
                  <SelectItem value="UUID">UUID</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="IdentifierDetails.Identifier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identifier</FormLabel>
            <FormControl>
              <Input {...field} placeholder={getIdentifierPlaceholder()} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function PixSubmitButton() {
  const { formState } = useFormContext<PixFormSchema>();

  return (
    <Button disabled={!formState.isValid} size="lg" type="submit" variant="default">
      Continue
    </Button>
  );
}
