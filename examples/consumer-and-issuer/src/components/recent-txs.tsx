import { ArrowDownRight } from "lucide-react";

export default function RecentTransactions() {
  return (
    <div className="flex-1 rounded-lg bg-[#0a0b14] text-white">
      <div className="mb-8">
        <h2 className="font-medium text-2xl">Recent Transactions</h2>
      </div>

      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg">Amazon.com</h3>
            <p className="text-gray-400">2023-07-15</p>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-lg">-$129.99</span>
            <ArrowDownRight className="ml-1 h-5 w-5 text-[#ff6b6b]" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg">Whole Foods Market</h3>
            <p className="text-gray-400">2023-07-10</p>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-lg">-$89.72</span>
            <ArrowDownRight className="ml-1 h-5 w-5 text-[#ff6b6b]" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg">Netflix Subscription</h3>
            <p className="text-gray-400">2023-07-05</p>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-lg">-$15.99</span>
            <ArrowDownRight className="ml-1 h-5 w-5 text-[#ff6b6b]" />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-gray-700 py-3 text-center font-medium"
      >
        View All Transactions
      </button>
    </div>
  );
}
