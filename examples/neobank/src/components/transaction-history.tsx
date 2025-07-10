"use client";
import { TokenETH, TokenUSDC } from "@web3icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiveIcon, SendIcon, SwapIcon } from "./icons";

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
  const iconProps = {
    className: "text-green-400",
    size: 12,
  };
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <SendIcon {...iconProps} />;
      case "swap":
        return <SwapIcon {...iconProps} size={19} />;
      default:
        return <ReceiveIcon {...iconProps} />;
    }
  };

  return (
    <Card className="h-full w-full rounded-3xl border-none bg-card text-white">
      <CardContent className="px-6">
        {/* Header */}
        <h2 className="mb-6 font-semibold text-2xl text-white">Transactions</h2>

        {/* Transaction List */}
        <div className="">
          {transactions.map((transaction, index) => (
            <div key={transaction.id} className="relative">
              <div className="flex items-center gap-4 py-3">
                {/* Transaction Type Icon */}

                <div className="relative flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="relative">
                    <div
                      className="absolute inset-0 bg-white"
                      style={{
                        clipPath: "circle(15px at center)",
                        width: "48px",
                        height: "48px",
                      }}
                    />
                    {/* USDC icon on top */}
                    <TokenUSDC
                      color="#3C75C3"
                      size={48}
                      variant="branded"
                      className="relative z-10"
                    />
                    <div className="-bottom-[1px] -right-[1px] absolute z-20 flex h-4 w-4 items-center justify-center rounded-[5px] bg-sidebar-accent">
                      <TokenETH color="white" size={17.5} variant="branded" />
                    </div>
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
                    className={`text-sm ${transaction.isPositive ? "text-neobank-primary" : "text-gray-400"}`}
                  >
                    {transaction.change}
                  </div>
                </div>
              </div>

              {/* Separator line */}
              {index < transactions.length - 1 && <div className="border-gray-700 border-b" />}
            </div>
          ))}
        </div>

        {/* All Transactions Link */}
        <div className="mt-8">
          <button
            type="button"
            className="text-white underline underline-offset-4 hover:text-gray-300"
          >
            All Transactions
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
