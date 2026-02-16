import { MenuIcon } from "lucide-react";
import { useUser } from "~/layouts/app";
import { Button } from "./ui/button";

export function Header() {
  const { address } = useUser();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "?";
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="outline" size="icon" className="md:hidden">
          <MenuIcon />
        </Button>
        <div className="font-bold text-lg text-foreground">NeoFinance</div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span>Mainnet</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors cursor-default">
          <div className="h-6 w-6 overflow-hidden rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            {shortAddress.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-xs">{shortAddress}</span>
        </div>
      </div>
    </header>
  );
}
