"use client";

import { Spinner, cn } from "@heroui/react";
import { CommandIcon, LogOut, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { injected, useAccount, useConnect, useDisconnect } from "wagmi";

const navLinks = [
  { name: "Swap", href: "/swap" },
  { name: "Pools", href: "/pools" },
  { name: "Bridge", href: "/bridge" },
  { name: "Shielder", href: "/shielder", active: true },
  { name: "Card", href: "/card" },
];

export default function Navbar() {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { connect, isPending } = useConnect();

  return (
    <nav className="flex h-16 items-center justify-between bg-black px-4 text-white md:px-6">
      <div className="flex items-center">
        <Link href="/" className="inline-flex gap-2">
          <CommandIcon className="h-6 w-6" />
          Acme Bank
        </Link>

        <div className="hidden items-center space-x-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-colors",
                link.active
                  ? "border-white border-b-2 text-white"
                  : "text-gray-400 hover:text-white",
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button type="button" className="rounded-full p-2 hover:bg-gray-800">
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {address ? (
          <>
            <div className="hidden items-center rounded-full bg-gray-900 px-3 py-1.5 md:flex">
              <div className="mr-2 flex items-center">
                <div className="relative mr-1 h-5 w-5">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-700 text-xs">
                    C
                  </div>
                </div>
                <span className="font-medium text-sm">$1,000.00</span>
              </div>
              <span className="text-gray-400 text-xs">2,500</span>
            </div>

            <button
              type="button"
              className="hidden items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-sm md:flex"
              onClick={() => disconnect()}
            >
              <>
                <span className="font-mono">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>

                <LogOut className="ml-1 h-4 w-4" />
              </>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-1.5 font-medium text-black text-sm md:flex"
            onClick={() => {
              connect({
                connector: injected(),
              });
            }}
          >
            <span>Connect Wallet</span>
            {isPending && <Spinner size="sm" />}
          </button>
        )}
      </div>
    </nav>
  );
}
