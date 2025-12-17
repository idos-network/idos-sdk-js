import { EVMConnector } from "@/components/evm-connector";
import { NearConnector } from "@/components/near-connector";
import { StellarConnector } from "@/components/stellar-connector";

function App() {
  return (
    <div className="grid h-full place-content-center gap-6 p-6">
      <div className="flex flex-col gap-4">
        <EVMConnector />
        <NearConnector />
        <StellarConnector />
      </div>
    </div>
  );
}

export default App;
