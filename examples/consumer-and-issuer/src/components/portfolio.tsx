import React from "react";
import AccountsOverview from "./account-overview";
import SimpleBalanceChart from "./balance-chart";
import RecentTransactions from "./recent-txs";

export default function Portfolio() {
  return (
    <div className="w-full rounded-lg bg-[#0a0b14] p-8 text-white">
      <div className="flex flex-col gap-8">
        <AccountsOverview />
        <RecentTransactions />
        <SimpleBalanceChart />
      </div>
    </div>
  );
}
