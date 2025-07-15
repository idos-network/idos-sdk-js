"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { trimAddress } from "../balance";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { address } = useAppKitAccount();

  return (
    <header
      className={cn("relative flex flex-col items-center justify-center gap-6 py-12 md:flex-row", {
        "bg-neutral-50": isHomePage,
      })}
    >
      <Link href="/">
        <Image
          src={!isHomePage ? "/logo-white.svg" : "/logo.svg"}
          alt="NeoBank"
          width={238}
          height={41}
        />
      </Link>
      {!isHomePage && (
        <div className="md:-translate-y-1/2 flex items-center gap-2 rounded-full bg-card p-2.5 text-secondary md:absolute md:top-1/2 md:right-10">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-green-300 to-green-500" />
          <div className="font-semibold">{trimAddress(address)}</div>
        </div>
      )}
    </header>
  );
}
