import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { JSX } from "react";

import { Providers } from "@/app/providers";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeoBank",
  description: "Demo application showcasing idOS Consumer and Issuer SDK's",
};

export default async function RootLayout(props: { children: JSX.Element }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="light grid min-h-dvh grid-rows-[auto_1fr_auto] bg-background text-foreground">
            <Header />
            <main>{props.children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
