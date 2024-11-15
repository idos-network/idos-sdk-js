import { CommandIcon } from "lucide-react";
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
  title: "idOS Issuer SDK Demo",
  description: "A demo app demonstrating the usage of the idOS Issuer SDK",
};

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(getConfig(), headers().get("cookie"));
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers initialState={initialState}>
          <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
            <header>
              <div className="container mx-auto px-6">
                <div className="flex h-16 items-center justify-between">
                  <Link href="/" className="inline-flex gap-2">
                    <CommandIcon className="h-6 w-6" />
                    idOS Issuer SDK Demo
                  </Link>
                  <div>
                    <WalletConnector />
                  </div>
                </div>
              </div>
            </header>
            <main className="container mx-auto p-6">{props.children}</main>
            <footer>
              <div className="container mx-auto px-6">
                <div className="flex h-12 items-center justify-center">
                  <p className="text-center text-gray-500 text-sm">
                    Made with ❤️ by{" "}
                    <Link
                      href="https://idos.network"
                      target="_blank"
                      className="underline underline-offset-4"
                    >
                      idOS
                    </Link>
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <div
            id="idOS"
            className="-translate-x-1/2 -translate-y-1/2 absolute bottom-[10%] left-1/2 z-[10000] flex w-[200px] flex-col items-center justify-center transition-opacity duration-150 ease-in"
          />
        </Providers>
      </body>
    </html>
  );
}
