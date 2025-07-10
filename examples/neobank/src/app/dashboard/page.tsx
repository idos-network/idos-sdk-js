import PerformanceChart from "@/components/performance-chart";
import TransactionHistory from "@/components/transaction-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <Tabs defaultValue="tokens" className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-gray-800 border-b bg-transparent p-0">
        <TabsTrigger
          value="tokens"
          className="w-[130px] rounded-none border-transparent border-x-0 border-t-0 border-b-2 pb-4 font-medium text-gray-400 hover:text-white data-[state=active]:border-green-400 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-green-400"
        >
          Tokens
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tokens" className="mt-11">
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
      </TabsContent>
    </Tabs>
  );
}
