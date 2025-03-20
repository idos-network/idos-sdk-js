import Image from "next/image";
import Link from "next/link";
import { WalletConnector } from "./wallet-connector";

export function Header() {
  return (
    <header className="bg-neutral-100 dark:bg-neutral-950">
      <nav className="container mx-auto flex h-16 items-center justify-between px-3">
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg text-neutral-900 dark:text-neutral-100"
          >
            <Image src="/static/logo.svg" alt="NeoBank" width={40} height={40} />
            NeoBank
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <WalletConnector />
        </div>
      </nav>
    </header>
  );
}
