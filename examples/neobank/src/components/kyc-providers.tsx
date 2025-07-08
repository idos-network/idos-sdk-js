import { useState } from "react";
import { OptionButton } from "./ui/option-button";
import Image from "next/image";
import { Tag } from "./ui/tag";

const providers = [
  {
    id: "persona",
    img: "/persona.svg",
    name: "Persona",
    isDefault: true,
  },
  {
    id: "sumsub",
    img: "/sumsub.svg",
    name: "Sumsub",
    isDefault: false,
  },
];

export default function KycProviders() {
  const [selectedProvider, setSelectedProvider] = useState("persona");
  return (
    <div className="flex flex-col bg-black">
      <h2 className="mb-10 font-medium text-3xl text-white">Continue with a KYC provider</h2>
      <div className="flex flex-col gap-4">
        {providers.map((provider) => (
          <OptionButton
            key={provider.id}
            selected={selectedProvider === provider.id}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <div className="flex w-full justify-between">
              <Image src={provider.img} alt={provider.name} width={100} height={100} />
              {provider.isDefault && <Tag>DEFAULT</Tag>}
            </div>
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
