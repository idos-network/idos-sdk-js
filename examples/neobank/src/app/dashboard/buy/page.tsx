"use client";

import { BuyTokens } from "@/components/buy-tokens";
import ProviderQuotes from "@/components/provider-quotes";
console.log("");
export default function BuyPage() {
  return (
    <div className="flex w-full justify-center gap-5">
      <BuyTokens />
      <ProviderQuotes />
    </div>
  );
}
