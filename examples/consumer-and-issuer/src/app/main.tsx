"use client";

import type { PropsWithChildren } from "react";
import { useAccount } from "wagmi";

export function Main({ children }: PropsWithChildren) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }
  return <main className="m-0 p-0">{children}</main>;
}
