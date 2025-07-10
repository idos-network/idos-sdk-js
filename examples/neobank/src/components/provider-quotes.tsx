"use client";

import Image from "next/image";
import { useState } from "react";
import { OptionButton } from "@/components/ui/option-button";
import { Tag } from "@/components/ui/tag";

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

const Provider = ({
  img,
  selected,
  usdc,
  usd,
  onClick,
  id,
}: {
  img: React.ReactNode;
  id: string;
  selected: boolean;
  name: string;
  usdc: string;
  usd: string;
  onClick: () => void;
}) => (
  <OptionButton
    selected={selected}
    onClick={onClick}
    topPart={
      id === "hifi" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Tag>BEST RATE</Tag>
            <Tag>MOST RELIABLE</Tag>
          </div>
        </div>
      )
    }
  >
    <div className="flex w-full justify-between">
      {img}
      <div className="flex flex-col items-end font-semibold">
        <div className="font-medium text-sm">{usdc}</div>
        <div className="text-green-400 text-xs">{usd}</div>
      </div>
    </div>
  </OptionButton>
);

export default function ProviderQuotes() {
  const [selectedProvider, setSelectedProvider] = useState("hifi");

  return (
    <div className="mx-auto max-w-2xl flex-1 rounded-2xl bg-card p-6 text-white">
      <div className="mb-2">
        <h1 className="mb-6 font-medium text-3xl">Provider quotes</h1>
        <p className="font-medium text-muted text-xs">Compare rates from these providers.</p>
      </div>

      <div className="flex flex-col gap-4">
        {providers.map((provider) => (
          <Provider
            key={provider.id}
            {...provider}
            selected={selectedProvider === provider.id}
            onClick={() => setSelectedProvider(provider.id)}
          />
        ))}
      </div>
    </div>
  );
}
