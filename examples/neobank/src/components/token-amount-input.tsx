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

export function TokenAmountInput({
  spendAmount,
  setSpendAmount,
  selectedCurrency,
  setSelectedCurrency,
  label,
}: {
  spendAmount: string;
  setSpendAmount: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-medium text-muted text-xs">{label}</Label>
      <div className="relative rounded-2xl bg-muted-foreground">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={spendAmount}
          onChange={(e) => setSpendAmount(e.target.value)}
          className="h-16 border-0 bg-gray-200 pr-40 pl-6 text-black text-xl placeholder:text-gray-500"
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          }}
        />
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="absolute top-2 right-2 min-h-[50px] w-20 border-0 bg-transparent font-medium text-black">
            <SelectValue placeholder="Select" />
            <ChevronDown className="absolute top-[50%] right-2 h-4 w-4 translate-y-[-50%] text-gray-600" />
          </SelectTrigger>
          <SelectContent className="absolute top-4 left-[100%] w-[50px]">
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
