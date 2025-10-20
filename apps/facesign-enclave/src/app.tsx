import { Outlet } from "react-router";
import { WalletContextProvider } from "./lib/wallet";
import { StorageContextProvider } from "./lib/storage";

export function App() {
  return (
    <div className="w-full h-full bg-black">
      <StorageContextProvider>
        <WalletContextProvider>
          <Outlet />
        </WalletContextProvider>
      </StorageContextProvider>
    </div>
  );
}
