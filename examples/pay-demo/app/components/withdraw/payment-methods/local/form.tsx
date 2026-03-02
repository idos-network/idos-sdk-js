import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
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
import {
  type BankLocalFormSchema,
  COAccountTypeEnum,
  COBankEnum,
  COIdentificationTypeEnum,
  createBankLocalSchema,
  PaymentPurposeEnum,
} from "./schema";

const CAPITALIZE_REGEX = /([A-Z])/g;
const FIRST_CHAR_REGEX = /^./;

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type: "input" | "select";
  inputMode?: "text" | "numeric" | "tel";
  options?: Array<{ value: string; label: string }>;
  conditionalPlaceholder?: (value: string) => string;
};

type CountryFieldConfig = {
  fields: FieldConfig[];
};

function getFieldConfig(countryCode: "AR" | "CO" | "MX"): CountryFieldConfig {
  const baseFields: FieldConfig[] = [
    {
      name: "AccountHolderAddress.Address",
      label: "Address",
      placeholder: "Enter your address (3-70 characters)",
      type: "input",
    },
    {
      name: "AccountHolderAddress.City",
      label: "Town",
      placeholder: "Enter your town (max 35 characters)",
      type: "input",
    },
    {
      name: "AccountHolderAddress.State",
      label: "State/Province",
      placeholder: "Enter state/province (max 35 characters)",
      type: "input",
    },
    {
      name: "PaymentPurpose",
      label: "Payment Purpose",
      type: "select",
      options: PaymentPurposeEnum.options.map((option) => ({
        value: option,
        label: option
          .replace(CAPITALIZE_REGEX, " $1")
          .replace(FIRST_CHAR_REGEX, (str) => str.toUpperCase()),
      })),
    },
  ];

  if (countryCode === "AR") {
    return {
      fields: [
        ...baseFields,
        {
          name: "TaxID",
          label: "Tax ID",
          placeholder: "Enter 11-digit Tax ID (e.g., 12345678901)",
          type: "input",
          inputMode: "numeric",
        },
        {
          name: "BankDetails.AccountNumber",
          label: "Account Number (CBU)",
          placeholder: "Enter 22-digit CBU",
          type: "input",
          inputMode: "numeric",
        },
      ],
    };
  }

  if (countryCode === "CO") {
    return {
      fields: [
        ...baseFields,
        {
          name: "Identification.IDType",
          label: "ID Type",
          type: "select",
          options: COIdentificationTypeEnum.options.map((option) => {
            let label = "Passport";
            if (option === "TaxID") {
              label = "Tax ID";
            } else if (option === "NationalIDCard") {
              label = "National ID Card";
            } else if (option === "ForeignerID") {
              label = "Foreigner ID";
            }
            return {
              value: option,
              label,
            };
          }),
        },
        {
          name: "Identification.ID",
          label: "ID Code",
          type: "input",
          conditionalPlaceholder: (idType: string) => {
            if (idType === "TaxID") {
              return "Enter Tax ID (9-10 digits)";
            }
            if (idType === "NationalIDCard") {
              return "Enter National ID (6-10 digits)";
            }
            if (idType === "ForeignerID") {
              return "Enter Foreigner ID (6-7 digits)";
            }
            if (idType === "Passport") {
              return "Enter Passport (8-11 characters)";
            }
            return "Enter ID code";
          },
        },
        {
          name: "PhoneNumber",
          label: "Phone Number",
          placeholder: "+1234567890 (6-15 digits)",
          type: "input",
          inputMode: "tel",
        },
        {
          name: "BankDetails.AccountNumber",
          label: "Account Number",
          placeholder: "Enter account number (5-20 digits)",
          type: "input",
          inputMode: "numeric",
        },
        {
          name: "BankDetails.Bank",
          label: "Bank",
          type: "select",
          options: COBankEnum.options.map((bank) => ({
            value: bank,
            label: bank,
          })),
        },
        {
          name: "BankDetails.Type",
          label: "Account Type",
          type: "select",
          options: COAccountTypeEnum.options.map((type) => ({
            value: type,
            label: type,
          })),
        },
      ],
    };
  }

  if (countryCode === "MX") {
    return {
      fields: [
        ...baseFields,
        {
          name: "TaxID",
          label: "Tax ID (RFC)",
          placeholder: "Enter Tax ID (RFC) (12-13 characters)",
          type: "input",
        },
        {
          name: "PhoneNumber",
          label: "Phone Number",
          placeholder: "+1234567890 (6-15 digits)",
          type: "input",
          inputMode: "tel",
        },
        {
          name: "BankDetails.AccountNumber",
          label: "Account Number (CLABE)",
          placeholder: "Enter 18-digit CLABE",
          type: "input",
          inputMode: "numeric",
        },
      ],
    };
  }

  throw new Error(`Unsupported country code: ${countryCode}`);
}

// Default values generator
function getDefaultValues(countryCode: "AR" | "CO" | "MX"): Partial<BankLocalFormSchema> {
  const baseDefaults = {
    countryCode,
    AccountHolderAddress: {
      Address: "",
      City: "",
      State: "",
    },
    PaymentPurpose: "",
  };

  if (countryCode === "AR") {
    return {
      ...baseDefaults,
      TaxID: "",
      BankDetails: {
        AccountNumber: "",
      },
    };
  }

  if (countryCode === "CO") {
    return {
      ...baseDefaults,
      Identification: {
        IDType: "",
        ID: "",
      },
      PhoneNumber: "",
      BankDetails: {
        AccountNumber: "",
        Bank: "",
        Type: "",
      },
    };
  }

  if (countryCode === "MX") {
    return {
      ...baseDefaults,
      TaxID: "",
      PhoneNumber: "",
      BankDetails: {
        AccountNumber: "",
      },
    };
  }

  throw new Error(`Unsupported country code: ${countryCode}`);
}

// Component types
export type BankLocalProps = {
  countryCode: "AR" | "CO" | "MX";
  onSubmit: (data: BankLocalFormSchema) => void;
  children?: React.ReactNode;
};

// Main form component
export function BankLocal({ countryCode, onSubmit, children }: BankLocalProps) {
  const schema = createBankLocalSchema(countryCode);
  const defaultValues = getDefaultValues(countryCode);

  const form = useForm({
    resolver: zodResolver(schema as never),
    mode: "onBlur",
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form className="flex flex-1 place-content-center" onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}

// Form fields component
export function BankLocalFormFields() {
  const { control, watch, getValues } = useFormContext();
  const countryCode = getValues("countryCode") as "AR" | "CO" | "MX";
  const fieldConfig = getFieldConfig(countryCode);

  return (
    <div className="flex flex-col gap-5">
      {fieldConfig.fields.map((field) => {
        if (field.type === "select") {
          return (
            <FormField
              control={control}
              key={field.name}
              name={field.name as never}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <Select onValueChange={formField.onChange} value={formField.value}>
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem
                            className="capitalize"
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }

        // Input field
        const watchedValue = watch(field.name as never) as unknown as string;
        const placeholder = field.conditionalPlaceholder
          ? field.conditionalPlaceholder(watchedValue || "")
          : field.placeholder;

        return (
          <FormField
            control={control}
            key={field.name}
            name={field.name as never}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input {...formField} inputMode={field.inputMode} placeholder={placeholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
    </div>
  );
}

// Submit button component
export function BankLocalSubmitButton() {
  const { formState } = useFormContext();

  return (
    <Button disabled={!formState.isValid} size="lg" type="submit" variant="default">
      Continue
    </Button>
  );
}
