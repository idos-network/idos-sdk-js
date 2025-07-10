"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header className={`flex items-center justify-center ${isHomePage && "bg-neutral-50"} py-12`}>
      <Link href="/">
        <Image
          src={!isHomePage ? "/logo-white.svg" : "/logo.svg"}
          alt="NeoBank"
          width={238}
          height={41}
        />
      </Link>
    </header>
  );
}
