import PerformanceChart from "@/components/performance-chart";
import TransactionHistory from "@/components/transaction-history";
import { useDisconnect } from "@reown/appkit/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {

  const { disconnect } = useDisconnect();
  const router = useRouter();

  const disconnectWallet = async () => {
    await disconnect();
    router.replace("/");
  }
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex-1">
          <PerformanceChart />
        </div>
        <div className="flex-2">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
