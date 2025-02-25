"use client";

import type { PropsWithChildren } from "react";
import { useAccount } from "wagmi";

export function Main({ children }: PropsWithChildren) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }
  return <main className="p-6">{children}</main>;
}
