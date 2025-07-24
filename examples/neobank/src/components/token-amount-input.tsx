"use client";

import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function TokenAmountInput({
  spendAmount,
  setSpendAmount,
  selectedCurrency,
  setSelectedCurrency,
  label,
  prefix,
  options,
}: {
  spendAmount: string;
  setSpendAmount: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  label?: string;
  prefix?: string;
  options: DropdownOption[];
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
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="absolute top-2 right-2 min-h-[50px] w-[110px] border-0 bg-transparent font-medium text-black justify-end">
            <SelectValue placeholder="Select" />
            <ChevronDown className="absolute top-[50%] right-2 h-4 w-4 translate-y-[-50%] text-gray-600" />
          </SelectTrigger>
          <SelectContent className="absolute top-4 right-[-110px] w-[70px]">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="flex items-center gap-2"
              >
                {option.icon}
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
