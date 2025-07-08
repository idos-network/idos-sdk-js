"use client";

import type { ReactNode } from "react";
import { AppKitProvider } from "./lib/reown";

export function Providers({ children }: { children: ReactNode }) {
  return <AppKitProvider>{children}</AppKitProvider>;
}
