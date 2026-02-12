import { Outlet } from "react-router";
import idosLogo from "./assets/idos-logo.svg";
import { KeyStorageContextProvider } from "./contexts/key";
import { RequestsContextProvider } from "./contexts/requests";

export function App() {
  return (
    <div className="w-full h-full bg-black relative">
      <KeyStorageContextProvider>
        <RequestsContextProvider>
          <Outlet />
        </RequestsContextProvider>
      </KeyStorageContextProvider>
      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-white opacity-70">
        <span className="text-sm">Powered by</span>
        <img src={idosLogo} alt="idOS" className="h-6" />
      </div>
    </div>
  );
}
