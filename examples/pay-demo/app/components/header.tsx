import { MenuIcon } from "lucide-react";
import { useUser } from "~/layouts/app";
import { Button } from "./ui/button";

export function Header() {
  const { address } = useUser();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "?";
  return (
    <header className="flex h-16 w-full items-center justify-between border-border border-b bg-card px-6">
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="outline" size="icon" className="md:hidden">
          <MenuIcon />
        </Button>
        <div className="font-bold text-foreground text-lg">NeoFinance</div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-medium text-muted-foreground text-xs sm:flex">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          <span>Mainnet</span>
        </div>

        <div className="flex cursor-default items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground text-sm shadow-sm transition-colors">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 font-bold text-[10px] text-white">
            {shortAddress.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-xs">{shortAddress}</span>
        </div>
      </div>
    </header>
  );
}
