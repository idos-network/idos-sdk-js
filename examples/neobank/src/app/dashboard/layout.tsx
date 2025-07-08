import Image from "next/image";
import type React from "react";
import ActionToolbar from "@/components/action-toolbar";
import BalanceComponent from "@/components/balance";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-black py-12">
      <div className="mb-[104px] place-items-center">
        <Image src="/logo-white.svg" alt="NeoBank" width={238} height={41} />
      </div>
      <div className="mx-auto flex max-w-[1022px] flex-col gap-12">
        <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
          <BalanceComponent />
          <ActionToolbar />
        </div>
        {children}
      </div>
    </div>
  );
}
