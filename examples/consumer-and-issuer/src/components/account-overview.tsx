import { CreditCard, Repeat, Send, Wallet } from "lucide-react";

export default function AccountsOverview() {
  return (
    <div className="flex-1 rounded-lg bg-[#0a0b14] text-white">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-medium text-4xl">Accounts Overview</h2>
      </div>

      <div className="mb-6">
        <h1 className="mb-1 font-bold text-4xl">$6,446,500</h1>
        <p className="text-gray-400">Total balance across all accounts</p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Checking</span>
          <span className="font-medium">$7,500</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Savings</span>
          <span className="font-medium">$560,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Investment</span>
          <span className="font-medium">$5,879,000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-black"
        >
          <CreditCard className="h-5 w-5" />
          <span className="font-medium">Request</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-black"
        >
          <Send className="h-5 w-5" />
          <span className="font-medium">Send</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-black"
        >
          <Wallet className="h-5 w-5" />
          <span className="font-medium">Buy</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-black"
        >
          <Repeat className="h-5 w-5" />
          <span className="font-medium">Swap</span>
        </button>
      </div>
    </div>
  );
}
