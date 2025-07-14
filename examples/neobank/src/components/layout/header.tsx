"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trimAddress } from "../balance";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { address } = useAppKitAccount();

  return (
    <header
      className={`relative flex items-center justify-center ${isHomePage && "bg-neutral-50"} py-12`}
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
        <div className="-translate-y-1/2 absolute top-[50%] right-10 flex items-center gap-2 rounded-full bg-card p-2.5 text-secondary">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-green-300 to-green-500" />
          <div className="font-semibold">{trimAddress(address)}</div>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </header>
  );
}
