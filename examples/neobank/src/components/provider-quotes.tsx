"use client";

import { useQueries } from "@tanstack/react-query";
import Image from "next/image";
import { useBuyStore } from "@/app/dashboard/buy/store";
import { OptionButton } from "@/components/ui/option-button";
import { Tag } from "@/components/ui/tag";
import { type OnRampProvider, useAppStore } from "@/stores/app-store";
import { Skeleton } from "./ui/skeleton";

interface Provider {
  id: string;
  name: string;
  isBestRate: boolean;
  isMostReliable: boolean;
  usdc: string;
  usd: string;
  img: React.ReactNode;
}

const providers: Provider[] = [
  {
    id: "hifi",
    name: "HiFi",
    isBestRate: true,
    isMostReliable: true,
    usdc: "100 USDC",
    usd: "$101.07 USD",
    img: <Image src="/hifi.svg" alt="HiFi" width={100} height={100} />,
  },
  {
    id: "transak",
    name: "Transak",
    isBestRate: false,
    isMostReliable: false,
    usdc: "100 USDC",
    usd: "$101.07 USD",
    img: <Image src="/transak.svg" alt="Transak" width={100} height={100} />,
  },
  {
    id: "noah",
    name: "Noah",
    isBestRate: false,
    isMostReliable: false,
    usdc: "100 USDC",
    usd: "$101.07 USD",
    img: <Image src="/noah.svg" alt="Noah" width={100} height={100} />,
  },
];

// Provider now receives quote and isBestRate as props, but does not render any UI for isBestRate
const Provider = ({
  img,
  selected,
  onClick,
  quote,
  isBestRate,
  loading,
}: {
  img: React.ReactNode;
  id: string;
  name: string;
  usdc: string;
  usd: string;
  selected: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  quote: any;
  isBestRate: boolean;
  loading: boolean;
  onClick: () => void;
}) => {
  const { setRate, spendAmount, selectedToken } = useBuyStore();
  return (
    <OptionButton
      selected={selected}
      onClick={() => {
        setRate(quote?.rate);
        onClick();
      }}
      topPart={
        isBestRate && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Tag>BEST RATE</Tag>
            </div>
          </div>
        )
      }
    >
      <div className="flex w-full justify-between">
        {img}
        <div className="flex flex-col items-end font-semibold">
          <div className="font-medium text-green-400 text-sm">
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <>
                {Number(((+spendAmount || 100) * +quote?.rate).toFixed(2)).toFixed(2)}{" "}
                {selectedToken}
                <div className="text-green-400 text-xs">
                  {Number(spendAmount || 100).toFixed(2)} USD
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </OptionButton>
  );
};

export default function ProviderQuotes() {
  const { selectedOnRampProvider, setOnRampProvider } = useAppStore();
  const providerIds = providers.map((p) => p.id);

  // Fetch all quotes in parallel
  const queries = useQueries({
    queries: providerIds.map((id) => ({
      queryKey: ["quote", id],
      queryFn: () => fetch(`/api/quotes?provider=${id}`).then((res) => res.json()),
    })),
  });

  // Find the best rate (highest rate)
  const rates = queries.map((q) => Number(q.data?.rate || 0));
  const bestRate = Math.max(...rates);
  const bestProviderIndex = rates.findIndex((r) => r === bestRate && r > 0);

  // Sort providers by rate descending
  const providersWithRates = providers.map((provider, idx) => ({
    ...provider,
    rate: rates[idx],
    quote: queries[idx].data,
    isBestRate: idx === bestProviderIndex && bestRate > 0,
  }));
  const sortedProviders = [...providersWithRates].sort((a, b) => (b.rate || 0) - (a.rate || 0));

  return (
    <div className="mx-auto max-w-2xl flex-1 rounded-2xl bg-card p-6 text-white">
      <div className="mb-2">
        <h1 className="mb-6 font-medium text-3xl">Provider quotes</h1>
        <p className="font-medium text-muted text-xs">Compare rates from these providers.</p>
      </div>
      <div className="flex flex-col gap-4">
        {sortedProviders.map((provider, idx) => (
          <Provider
            key={provider.id}
            {...provider}
            loading={queries[idx].isLoading}
            selected={selectedOnRampProvider === provider.id}
            onClick={() => setOnRampProvider(provider.id as OnRampProvider)}
            quote={provider.quote}
            isBestRate={provider.isBestRate}
          />
        ))}
      </div>
    </div>
  );
}
