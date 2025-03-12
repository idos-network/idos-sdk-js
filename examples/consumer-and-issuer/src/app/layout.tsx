import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/app/providers";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
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
            <Header />
            <main>{props.children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
