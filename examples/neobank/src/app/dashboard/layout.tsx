import type React from "react";
import ActionToolbar from "@/components/action-toolbar";
import BalanceComponent from "@/components/balance";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col px-5 py-12">
      <div className="mx-auto flex w-full max-w-[1022px] flex-col gap-12">
        <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-center">
          <BalanceComponent />
          <ActionToolbar />
        </div>

        {children}
      </div>
    </div>
  );
}
