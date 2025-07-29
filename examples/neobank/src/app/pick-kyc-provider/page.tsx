"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OptionButton } from "@/components/ui/option-button";
import { Tag } from "@/components/ui/tag";
import { type KycProvider, useAppStore } from "@/stores/app-store";

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
  const { setKycProvider, selectedKyc } = useAppStore();
  return (
    <div className="mx-auto flex h-full w-full max-w-[432px] flex-1 flex-col justify-center">
      <h2 className="mb-10 text-center font-medium text-3xl text-white">
        Continue with a KYC provider
      </h2>
      <div className="flex flex-col gap-4">
        {providers.map((provider) => (
          <OptionButton
            className="max-h-[75px]"
            key={provider.id}
            selected={selectedKyc === provider.id}
            onClick={() => {
              setKycProvider(provider.id as KycProvider);
            }}
          >
            <div className="flex w-full justify-between">
              <Image src={provider.img} alt={provider.name} width={100} height={100} />
              {provider.isDefault && <Tag>DEFAULT</Tag>}
            </div>
          </OptionButton>
        ))}
      </div>
      <Button asChild className="mx-auto mt-14 h-12 w-fit rounded-full bg-secondary px-12">
        <Link href="/kyc-flow">Continue</Link>
      </Button>
    </div>
  );
}
