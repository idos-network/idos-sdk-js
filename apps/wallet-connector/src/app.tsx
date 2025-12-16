import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="grid h-full place-content-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">idOS Wallet Connector</h1>
      <div className="flex flex-col gap-4">
        <Button>Connect with EVM</Button>
        <Button>Connect with NEAR</Button>
        <Button>Connect with Stellar</Button>
        <Button>Connect with XRP</Button>
      </div>
    </div>
  );
}

export default App;
