"use client";
import { ArrowUpDown, ArrowUpRight, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Transaction {
  id: string;
  type: "buy" | "sell" | "swap";
  currency: string;
  amount: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const transactions: Transaction[] = [
  {
    id: "1",
    type: "buy",
    currency: "USDC",
    amount: "3.956 USDC",
    value: "$100.00",
    change: "-1.55%",
    isPositive: false,
  },
  {
    id: "2",
    type: "swap",
    currency: "USI",
    amount: "3.956 USDC",
    value: "$100.00",
    change: "-1.55%",
    isPositive: false,
  },
  {
    id: "3",
    type: "swap",
    currency: "USDC",
    amount: "3.956 USDC",
    value: "$100.00",
    change: "-1.55%",
    isPositive: false,
  },
  {
    id: "4",
    type: "buy",
    currency: "USDC",
    amount: "3.956 USDC",
    value: "$100.00",
    change: "-1.55%",
    isPositive: false,
  },
];

export default function TransactionsPanel() {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <ArrowUpRight className="h-4 w-4 text-green-400" />;
      case "swap":
        return <ArrowUpDown className="h-4 w-4 text-green-400" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-green-400" />;
    }
  };

  return (
    <Card className="h-full w-full rounded-3xl border-gray-800 bg-[#1E1E1E] text-white">
      <CardContent className="p-6">
        {/* Header */}
        <h2 className="mb-6 font-semibold text-2xl text-white">Transactions</h2>

        {/* Transaction List */}
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={transaction.id} className="relative">
              <div className="flex items-center gap-4 py-3">
                {/* Transaction Type Icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/20">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Currency Icon */}
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="-bottom-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                    <ArrowUpRight className="h-2 w-2 text-white" />
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="flex-1">
                  <div className="font-medium text-white">{transaction.currency}</div>
                  <div className="text-gray-400 text-sm">{transaction.amount}</div>
                </div>

                {/* Value and Change */}
                <div className="text-right">
                  <div className="font-medium text-green-400">{transaction.value}</div>
                  <div
                    className={`text-sm ${transaction.isPositive ? "text-green-400" : "text-gray-400"}`}
                  >
                    {transaction.change}
                  </div>
                </div>
              </div>

              {/* Separator line */}
              {index < transactions.length - 1 && <div className="mt-3 border-gray-700 border-b" />}
            </div>
          ))}
        </div>

        {/* All Transactions Link */}
        <div className="mt-8">
          <button type="button" className="text-white underline underline-offset-4 hover:text-gray-300">
            All Transactions
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
