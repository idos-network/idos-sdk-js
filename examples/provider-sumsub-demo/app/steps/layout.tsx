"use client";

import CurrentContextProvider from "../lib/current";
import { Web3Modal } from "../lib/web3modal";
import Progress from "./progress";

export default function StepsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CurrentContextProvider>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-300 px-6 pb-4">
          <nav className="mt-10 flex flex-1 flex-col">
            <Progress />
          </nav>
        </div>
      </div>
      <div className="h-full lg:pl-72">
        <main className="h-full py-10">
          <div className="h-full px-4 sm:px-6 lg:px-8">
            <Web3Modal>{children}</Web3Modal>
          </div>
        </main>
      </div>
    </CurrentContextProvider>
  );
}
