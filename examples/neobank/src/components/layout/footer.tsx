"use client";

import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { useIdosStore } from "@/stores/idos-store";
import { Button } from "../ui/button";

const defaultFooterPaths = ["/", "/pick-kyc-provider"];
const backToHomeButtonPaths = ["/kyc-flow"];

const BackToHomeButton = ({ pathname }: { pathname: string }) => {
  const isBackToHomeButtonPath = backToHomeButtonPaths.includes(pathname);

  if (!isBackToHomeButtonPath) return null;

  return (
    <Link href="/dashboard" className="absolute left-10 flex items-center justify-center gap-2">
      <Button className="rounded-full bg-card text-secondary">
        <ChevronLeft className="mr-2" />
        Home
      </Button>
    </Link>
  );
};

const HomeFooter = ({ pathname, hasDarkBg }: { pathname: string; hasDarkBg?: boolean }) => {
  const isDefaultFooterPath = defaultFooterPaths.includes(pathname);

  if (!isDefaultFooterPath) return null;

  return (
    <p className="gap-1 text-neutral-400 text-sm">
      Your account is powered by
      <Image src="/idos.svg" alt="idOS" width={20} height={20} className="mx-1 inline-block" />
      <span className={`font-semibold ${hasDarkBg ? "text-white" : "text-neutral-950"}`}>idOS</span>
      , ensuring all your data is encrypted and controlled by you.
    </p>
  );
};

function DisconnectButton({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { address } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { reset: resetIdosStore } = useIdosStore();
  const { reset: resetAppStore } = useAppStore();

  const handleDisconnect = async () => {
    resetAppStore();
    resetIdosStore();
    await disconnect();
    router.push("/");
  };

  if (pathname === "/") return null;

  if (!address) return null;
  return (
    <Button
      className="absolute right-10 rounded-full bg-card text-secondary"
      onClick={handleDisconnect}
    >
      Disconnect
    </Button>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <footer
      className={`flex h-20 items-center justify-center ${isHomePage && "bg-neutral-50"} relative p-5 text-center`}
    >
      <HomeFooter pathname={pathname} hasDarkBg={!isHomePage} />
      <DisconnectButton pathname={pathname} />
      <BackToHomeButton pathname={pathname} />
    </footer>
  );
}
