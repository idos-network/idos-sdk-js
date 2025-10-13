import { Outlet } from "react-router";

export function App() {
  return (
    <div className="w-full h-full bg-black">
      <Outlet />
    </div>
  );
}
