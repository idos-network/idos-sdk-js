"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const HomeFooter = () => (
  <p className="gap-1 text-neutral-400 text-sm">
    Your account is powered by
    <Image src="/idOS.svg" alt="idOS" width={20} height={20} className="mx-1 inline-block" />
    <span className="font-semibold text-neutral-950">idOS</span>, ensuring all your data is
    encrypted and controlled by you.
  </p>
);

export function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <footer
      className={`flex h-20 items-center justify-center ${isHomePage && "bg-neutral-50"} p-5 text-center`}
    >
      {isHomePage && <HomeFooter />}
    </footer>
  );
}
