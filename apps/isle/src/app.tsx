import type { ComponentChildren } from "preact";

import { Badge } from "@/components/badge";
import { DisconnectedIcon } from "@/components/icons/disconnected";
import { Logo } from "@/components/logo";

interface LayoutProps {
  children?: ComponentChildren;
}
function Layout({ children }: LayoutProps) {
  return (
    <div class="mx-auto flex max-w-[366px] flex-col gap-6 rounded-[38px] bg-neutral-900 p-5 shadow-lg">
      <header class="flex justify-between gap-5">
        <div class="flex items-center gap-2">
          <Logo size="lg" />
          <div class="flex flex-col gap-1">
            <span class="font-medium text-sm">idOS</span>
            <Badge>Disconnected</Badge>
          </div>
        </div>
        <DisconnectedIcon class="text-slate-500" size="lg" />
      </header>
      <main>{children}</main>
      <footer class="flex flex-col items-center justify-end">
        <p class="flex items-center gap-2 text-slate-500 text-sm leading-0">
          Powered by <img src="/footer-logo.svg" alt="Powered by idOS" />
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return <Layout />;
}
