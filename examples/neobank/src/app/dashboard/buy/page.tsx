"use client";

import { useState } from "react";
import { BuyTokens } from "@/components/buy-tokens";
import ProviderQuotes from "@/components/provider-quotes";

export default function BuyPage() {
  const [showProviderQuotes, setShowProviderQuotes] = useState(false);
  return (
    <div className="flex w-full justify-center gap-5">
      <BuyTokens onCurrencySelected={setShowProviderQuotes} />
      {showProviderQuotes && <ProviderQuotes />}
    </div>
  );
}
