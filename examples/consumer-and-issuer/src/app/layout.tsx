import { CommandIcon } from "lucide-react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { Main } from "@/app/main";
import { Providers } from "@/app/providers";
import { WalletConnector } from "@/components/wallet-connector";
import { getConfig } from "@/wagmi.config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "idOS Consumer and Issuer Demo",
  description: "Showcase app of the idOS Consumer and Issuer SDK's",
};

export default async function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(getConfig(), (await headers()).get("cookie"));
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
                    Acme Bank
                  </Link>
                  <div>
                    <WalletConnector />
                  </div>
                </div>
              </div>
            </header>
            <div>
              <Main>{props.children}</Main>
            </div>
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
        </Providers>
      </body>
    </html>
  );
}
