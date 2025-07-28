"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const currencies = [
  {
    value: "USD",
    label: "USD",
    prefix:"$",
  },
  {
    value: "EUR",
    label: "EUR",
    disabled: true,
    prefix:"€",
  },
  {
    value: "GBP",
    label: "GBP",
    disabled: true,
    prefix:"£"
  },
];

export const tokens = [
  {
    value: "USDC",
    label: "USDC",
    prefix:"$",
  },
  {
    value: "USDT",
    label: "USDT",
    disabled: true,
    prefix:"$",
  },
  {
    value: "ETH",
    label: "ETH",
    disabled: true,
    prefix:"ETH",
  },
];


interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function TokenAmountInput({
  value: spendAmount,
  onValueChange: setSpendAmount,
  selectedValue,
  setSelectedValue,
  label,
  selectOptions,
  prefix,
}: {
  value: string;
  onValueChange: (value: string) => void;
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  label?: string;
  selectOptions: {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-medium text-muted text-xs">{label}</Label>
      <div className="relative rounded-2xl bg-muted-foreground">
        {prefix && (
          <span className="-translate-y-1/2 absolute top-1/2 left-[2%] z-10 transform font-medium text-black">
            {prefix}
          </span>
        )}
        <Input
          type="text"
          placeholder="0"
          value={spendAmount}
          onChange={(e) => setSpendAmount(e.target.value)}
          className="h-16 border-0 bg-gray-200 pr-40 pl-6 font-medium text-black text-xl placeholder:text-gray-500"
        />
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger className="absolute top-2 right-2 min-h-[50px] w-24 border-0 bg-transparent font-medium text-black">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent className="absolute top-4 left-[100%] w-[50px]">
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
