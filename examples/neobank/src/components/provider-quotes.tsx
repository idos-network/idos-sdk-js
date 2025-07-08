"use client";

import { useState } from "react";

export default function ProviderQuotes() {
  const [selectedProvider, setSelectedProvider] = useState("hifi");

  const providers = [
    {
      id: "hifi",
      name: "HiFi",
      isBestRate: true,
      isMostReliable: true,
      usdc: "100 USDC",
      usd: "$101.07 USD",
    },
    {
      id: "transak",
      name: "Transak",
      isBestRate: false,
      isMostReliable: false,
      usdc: "100 USDC",
      usd: "$101.07 USD",
    },
    {
      id: "noah",
      name: "Noah",
      isBestRate: false,
      isMostReliable: false,
      usdc: "100 USDC",
      usd: "$101.07 USD",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-black p-6 text-white">
      <div className="mb-8">
        <h1 className="mb-4 font-light text-4xl">Provider quotes</h1>
        <p className="text-gray-400 text-lg">Compare rates from these providers.</p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
              provider.isBestRate
                ? "border-green-500 bg-gray-900"
                : "border-gray-700 bg-gray-800 hover:border-gray-600"
            }`}
            // onClick={() => setSelectedProvider(provider.id)}
          >
            {/* Best Rate and Most Reliable badges */}
            {provider.isBestRate && (
              <div className="absolute top-4 left-6 flex gap-3">
                <span className="rounded-full bg-green-600 px-3 py-1 font-medium text-sm text-white">
                  BEST RATE
                </span>
                <span className="rounded-full bg-green-600 px-3 py-1 font-medium text-sm text-white">
                  MOST RELIABLE
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-4">
                {/* Radio button */}
                <div className="relative">
                  <input
                    type="radio"
                    name="provider"
                    value={provider.id}
                    checked={selectedProvider === provider.id}
                    onChange={() => setSelectedProvider(provider.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedProvider === provider.id ? "border-green-500" : "border-gray-500"
                    }`}
                  >
                    {selectedProvider === provider.id && (
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    )}
                  </div>
                </div>

                {/* Provider indicator dot and name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${provider.isBestRate ? "bg-green-500" : "bg-gray-500"}`}
                  />
                  <span className="text-2xl font-medium">{provider.name}</span>
                </div>
              </div>

              {/* Rates */}
              <div className="text-right">
                <div className="text-2xl font-medium">{provider.usdc}</div>
                <div className="text-green-400 text-lg">{provider.usd}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
