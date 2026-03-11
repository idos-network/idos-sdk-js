import { MenuIcon } from "lucide-react";

import { useUser } from "~/layouts/app";

import { Button } from "./ui/button";

export function Header() {
  const { address } = useUser();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "?";
  return (
    <header className="border-border bg-card flex h-16 w-full items-center justify-between border-b px-6">
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="outline" size="icon" className="md:hidden">
          <MenuIcon />
        </Button>
        <div className="text-foreground text-lg font-bold">NeoFinance</div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="border-border bg-muted text-muted-foreground hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium sm:flex">
          <div className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
          <span>Mainnet</span>
        </div>

        <div className="border-border bg-card text-foreground flex cursor-default items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-[10px] font-bold text-white">
            {shortAddress.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-xs">{shortAddress}</span>
        </div>
      </div>
    </header>
  );
}
