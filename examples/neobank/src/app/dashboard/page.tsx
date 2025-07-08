import PerformanceChart from "@/components/performance-chart";
import TransactionHistory from "@/components/transaction-history";

export default function Dashboard() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex-2">
          <PerformanceChart />
        </div>
        <div className="flex-2">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
