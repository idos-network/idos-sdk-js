import { CommandIcon } from "lucide-react";
import Link from "next/link";
import { WalletConnector } from "./wallet-connector";

export function Header() {
  return (
    <header className="bg-neutral-950">
      <nav className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg text-white">
            <CommandIcon className="h-6 w-6" />
            Acme Bank
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <WalletConnector />
        </div>
      </nav>
    </header>
  );
}
