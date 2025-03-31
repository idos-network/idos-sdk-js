import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/app/providers";
import { WalletConnector } from "@/components/wallet-connector";
import { getConfig } from "@/wagmi.config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "idOS Passporting Demo",
  description: "A demo app demonstrating the usage of the idOS Passporting functionality",
};

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(getConfig(), headers().get("cookie"));
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers initialState={initialState}>
          <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
            <header className="sticky top-0 z-sticky bg-gray-950 px-6">
              <div className="flex h-20 items-center justify-between gap-4">
                <Link href="/" className="text-lg text-white">
                  ACME Card Provider
                </Link>
                <WalletConnector />
              </div>
            </header>
            <main className="p-6">{props.children}</main>
          </div>
        </Providers>
        <div
          id="idOS-enclave"
          className="group -translate-x-1/2 -translate-y-1/2 absolute bottom-[0%] left-1/2 z-[10000] flex w-[200px] flex-col items-center justify-center overflow-hidden rounded-md bg-neutral-950 opacity-0 transition-opacity duration-150 ease-in [&.visible]:opacity-100"
        />
      </body>
    </html>
  );
}
