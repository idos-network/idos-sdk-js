import { ChevronDown } from "lucide-react";

export default function BalanceComponent() {
  return (
    <div className="flex items-center gap-6 bg-black">
      {/* Green Square */}
      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-green-300 to-green-500" />

      {/* Balance Info */}
      <div className="flex flex-col gap-2">
        {/* Wallet Address */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-lg text-white">0x0E76...77607</span>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>

        {/* Balance Amount */}
        <div className="font-bold text-6xl text-white">$12,340.56</div>
      </div>
    </div>
  );
}
