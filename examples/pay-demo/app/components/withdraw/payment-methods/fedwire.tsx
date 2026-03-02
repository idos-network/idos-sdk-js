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

const NAME_LIMITS = {
  FIRST_NAME_MIN: 3,
  FIRST_NAME_MAX: 32,
  LAST_NAME_MIN: 3,
  LAST_NAME_MAX: 32,
  COMBINED_NAME_MAX: 35,
  BUSINESS_NAME_MIN: 3,
  BUSINESS_NAME_MAX: 35,
} as const;

const ADDRESS_LIMITS = {
  ADDRESS_MIN: 3,
  ADDRESS_MAX: 70,
  CITY_MAX: 35,
  POSTAL_CODE_MIN: 5,
  POSTAL_CODE_MAX: 9,
  STATE_MAX: 35,
} as const;

const BANK_LIMITS = {
  ACCOUNT_NUMBER_MIN: 4,
  ACCOUNT_NUMBER_MAX: 17,
  ROUTING_NUMBER_LENGTH: 9,
} as const;

export const fedwireSchema = z.object({
  AccountHolderName: z
    .object({
      AccountHolderType: z.enum(["Individual", "Business"], {
        message: "Account Holder Type is required",
      }),
      Name: z.union([
        // Individual name structure
        z
          .object({
            FirstName: z
              .string()
              .min(NAME_LIMITS.FIRST_NAME_MIN, "First Name must be between 3 and 32 characters")
              .max(NAME_LIMITS.FIRST_NAME_MAX, "First Name must be between 3 and 32 characters"),
            LastName: z
              .string()
              .min(NAME_LIMITS.LAST_NAME_MIN, "Last Name must be between 3 and 32 characters")
              .max(NAME_LIMITS.LAST_NAME_MAX, "Last Name must be between 3 and 32 characters"),
          })
          .refine(
            (data) => (data.FirstName + data.LastName).length <= NAME_LIMITS.COMBINED_NAME_MAX,
            {
              message: "Combined first and last name must not exceed 35 characters",
            },
          ),
        // Business name structure
        z
          .string()
          .min(NAME_LIMITS.BUSINESS_NAME_MIN, "Name must be between 3 and 35 characters")
          .max(NAME_LIMITS.BUSINESS_NAME_MAX, "Name must be between 3 and 35 characters"),
      ]),
    })
    .refine(
      (data) => {
        if (data.AccountHolderType === "Individual") {
          return typeof data.Name === "object" && data.Name !== null;
        }
        if (data.AccountHolderType === "Business") {
          return typeof data.Name === "string";
        }
        return false;
      },
      {
        message: "Name structure must match Account Holder Type",
      },
    ),

  AccountHolderAddress: z.object({
    Address: z
      .string()
      .min(ADDRESS_LIMITS.ADDRESS_MIN, "Address must be at least 3 characters")
      .max(ADDRESS_LIMITS.ADDRESS_MAX, "Address must not exceed 70 characters"),
    City: z.string().max(ADDRESS_LIMITS.CITY_MAX, "City must not exceed 35 characters"),
    PostalCode: z
      .string()
      .min(ADDRESS_LIMITS.POSTAL_CODE_MIN, "Postal Code must be between 5 and 9 characters")
      .max(ADDRESS_LIMITS.POSTAL_CODE_MAX, "Postal Code must be between 5 and 9 characters"),
    State: z.string().max(ADDRESS_LIMITS.STATE_MAX, "State/Province must not exceed 35 characters"),
  }),

  BankDetails: z.object({
    AccountNumber: z
      .string()
      .min(BANK_LIMITS.ACCOUNT_NUMBER_MIN, "Account Number must be between 4 and 17 characters")
      .max(BANK_LIMITS.ACCOUNT_NUMBER_MAX, "Account Number must be between 4 and 17 characters"),
    BankCode: z
      .string()
      .length(BANK_LIMITS.ROUTING_NUMBER_LENGTH, "Routing Number must be exactly 9 characters"),
  }),

  PaymentPurpose: z.string({
    message: "Payment Purpose is required",
  }),
});

export type FedwireFormSchema = z.infer<typeof fedwireSchema>;

export type FedwireProps = {
  children?: React.ReactNode;
  onSubmit: (data: FedwireFormSchema) => void;
};

export function Fedwire({ children, onSubmit }: FedwireProps) {
  const form = useForm<FedwireFormSchema>({
    resolver: zodResolver(fedwireSchema),
    mode: "onBlur",
    defaultValues: {
      AccountHolderName: {
        AccountHolderType: "Individual",
        Name: "",
      },
      AccountHolderAddress: {
        Address: "",
        City: "",
        PostalCode: "",
        State: "",
      },
      BankDetails: {
        AccountNumber: "",
        BankCode: "",
      },
      PaymentPurpose: "",
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

export function FedwireFormFields() {
  const { control, watch } = useFormContext<FedwireFormSchema>();
  const accountHolderType = watch("AccountHolderName.AccountHolderType");

  return (
    <div className="flex flex-col gap-5">
      {/* Account Holder Type */}
      <FormField
        control={control}
        name="AccountHolderName.AccountHolderType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Holder Type</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account holder type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {accountHolderType === "Individual" && (
        <>
          <FormField
            control={control}
            name="AccountHolderName.Name.FirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name (3-32 characters)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="AccountHolderName.Name.LastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name (3-32 characters)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {accountHolderType === "Business" && (
        <FormField
          control={control}
          name="AccountHolderName.Name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter business name (3-35 characters)"
                  value={typeof field.value === "string" ? field.value : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
        name="AccountHolderAddress.PostalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal Code</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter postal code (5-9 characters)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="BankDetails.AccountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter account number (4-17 characters)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="BankDetails.BankCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Routing Number</FormLabel>
            <FormControl>
              <Input {...field} inputMode="numeric" placeholder="Enter routing number (9 digits)" />
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
              <Input {...field} placeholder="Enter payment purpose" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function FedwireSubmitButton() {
  const { formState } = useFormContext<FedwireFormSchema>();

  return (
    <Button disabled={!formState.isValid} size="lg" type="submit" variant="default">
      Continue
    </Button>
  );
}
