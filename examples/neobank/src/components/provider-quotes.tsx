"use client";

import Image from "next/image";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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

// @todo: refactor colors to theme variables
const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-md bg-[#043102] px-3 py-1 font-semibold text-[#74FB5B] text-xs">
    {children}
  </span>
);

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
  <button
    type="button"
    className={`flex cursor-pointer flex-col gap-6 rounded-2xl border p-6 ${
      selected ? "border-[#74FB5B]" : "border-[#88888880]"
    }`}
    onClick={onClick}
  >
    {id === "hifi" && (
      <div className="flex items-center gap-2">
        <Tag>BEST RATE</Tag>
        <Tag>MOST RELIABLE</Tag>
      </div>
    )}

    <div className="flex justify-between">
      <div className="flex items-center gap-4">
        <Checkbox checked={selected} onCheckedChange={() => onClick()} />
        {img}
      </div>

      <div className="flex flex-col items-end font-semibold">
        <div className="font-medium text-sm">{usdc}</div>
        <div className="text-green-400 text-xs">{usd}</div>
      </div>
    </div>
  </button>
);

export default function ProviderQuotes() {
  const [selectedProvider, setSelectedProvider] = useState("hifi");

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl bg-black p-6 text-white">
      <div className="mb-2">
        <h1 className="mb-6 font-light text-3xl">Provider quotes</h1>
        <p className="font-medium text-gray-400 text-xs">Compare rates from these providers.</p>
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
