"use client";

import { Button, Spinner, cn } from "@heroui/react";
import { CommandIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { injected, useAccount, useConnect, useDisconnect } from "wagmi";

const navLinks = [];

export default function Navbar() {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { connect, isPending } = useConnect();

  return (
    <nav className="flex h-16 items-center justify-between bg-neutral-950 px-4 text-white md:px-6">
      <div className="flex items-center">
        <Link href="/" className="inline-flex gap-2">
          <CommandIcon className="h-6 w-6" />
          Acme Bank
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {address ? (
          <>
            <div className="hidden items-center rounded-full bg-gray-900 px-3 py-1.5 md:flex">
              <div className="mr-2 flex items-center">
                <div className="relative mr-1 h-5 w-5">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-700 text-xs">
                    C
                  </div>
                </div>
                <span className="font-medium text-sm">Current Balance: $1,000.00</span>
              </div>
            </div>

            <Button onPress={() => disconnect()}>
              Logout
              <LogOutIcon className="ml-1 h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            isLoading={isPending}
            type="button"
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-1.5 font-medium text-black text-sm md:flex"
            onPress={() => {
              connect({
                connector: injected(),
              });
            }}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}
