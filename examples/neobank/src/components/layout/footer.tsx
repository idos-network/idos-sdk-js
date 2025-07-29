"use client";

import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { ChevronLeft, Link } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";

const defaultFooterPaths = ["/", "/pick-kyc-provider"];
const backToHomeButtonPaths = ["/kyc-flow"];

const BackToHomeButton = ({ pathname }: { pathname: string }) => {
  const isBackToHomeButtonPath = backToHomeButtonPaths.includes(pathname);

  if (!isBackToHomeButtonPath) return null;

  return (
    <div className="absolute left-10">
      <Link href="/dashboard">
        <Button className="rounded-full bg-card text-secondary">
          <ChevronLeft className="mr-2" />
          Home
        </Button>
      </Link>
    </div>
  );
};

const HomeFooter = ({ pathname }: { pathname: string }) => {
  const isDefaultFooterPath = defaultFooterPaths.includes(pathname);

  if (!isDefaultFooterPath) return null;

  return (
    <p className="gap-1 text-neutral-400 text-sm">
      Your account is powered by
      <Image src="/idos-logo.svg" alt="idOS" width={20} height={20} className="mx-1 inline-block" />
      <span className="font-semibold text-neutral-950">idOS</span>, ensuring all your data is
      encrypted and controlled by you.
    </p>
  );
};

function DisconnectButton({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { address } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  if (pathname === "/") return null;

  if (!address) return null;
  return (
    <Button
      className="absolute right-10 rounded-full bg-card text-secondary"
      onClick={async () => {
        await disconnect();
        router.push("/");
      }}
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
      className={`flex h-20 items-center justify-center ${isHomePage && "bg-neutral-50"} p-5 text-center`}
    >
      <HomeFooter pathname={pathname} />
      <DisconnectButton pathname={pathname} />
      <BackToHomeButton pathname={pathname} />
    </footer>
  );
}
