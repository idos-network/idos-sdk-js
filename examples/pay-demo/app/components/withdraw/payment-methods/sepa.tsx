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
import {
  getExampleIban,
  isSupportedCountry,
  isValidIbanForCountry,
  normalizeIban,
} from "~/lib/iban";

export const createSepaSchema = (countryCode: string) => {
  if (!isSupportedCountry(countryCode)) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }

  return z.object({
    AccountNumber: z
      .string()
      .transform((v) => normalizeIban(v))
      .refine((v) => isValidIbanForCountry(v, countryCode), {
        message: `Please enter a valid ${countryCode} IBAN`,
      }),
    AccountType: z.enum(["Checking", "Savings"], {
      message: "Please select an account type",
    }),
    countryCode: z.string().min(2).max(2),
  });
};

export type SepaFormSchema = z.infer<ReturnType<typeof createSepaSchema>>;

export type SepaProps = {
  children?: React.ReactNode;
  onSubmit: (data: SepaFormSchema) => void;
  countryCode: string;
};

export function Sepa({ children, onSubmit, countryCode }: SepaProps) {
  const schema = createSepaSchema(countryCode);

  const form = useForm<SepaFormSchema>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      AccountNumber: "",
      AccountType: "Checking",
      countryCode,
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

export function SepaFormFields() {
  const { control, getValues } = useFormContext<SepaFormSchema>();
  const exampleIban = getExampleIban(getValues("countryCode"));

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="AccountType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Type</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="AccountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Number</FormLabel>
            <FormControl>
              <Input {...field} inputMode="numeric" placeholder={exampleIban} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function SepaSubmitButton() {
  const { formState } = useFormContext<SepaFormSchema>();

  return (
    <Button disabled={!formState.isValid} size="lg" type="submit" variant="default">
      Continue
    </Button>
  );
}
