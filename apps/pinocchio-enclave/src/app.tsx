import { RequestsContextProvider } from "./contexts/requests";
import { StorageContextProvider } from "./contexts/storage";
import { WalletContextProvider } from "./contexts/wallet";
import { Outlet } from "react-router";

export function App() {
  return (
    <div className="w-full h-full bg-black">
      <StorageContextProvider>
        <WalletContextProvider>
          <RequestsContextProvider>
            <Outlet />
          </RequestsContextProvider>
        </WalletContextProvider>
      </StorageContextProvider>
    </div>
  );
}
