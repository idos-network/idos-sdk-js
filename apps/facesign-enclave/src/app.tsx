import { Outlet } from "react-router";
import idosLogo from "./assets/idos-logo.svg";

export function App() {
  return (
    <div className="relative h-full w-full bg-black">
      <Outlet />
      <div className="fixed right-4 bottom-4 flex items-center gap-2 text-white opacity-70">
        <span className="text-sm">Powered by</span>
        <img src={idosLogo} alt="idOS" className="h-6" />
      </div>
    </div>
  );
}
