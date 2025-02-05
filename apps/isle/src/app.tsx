import { DisconnectedIcon } from "@/components/icons/disconnected";
import type { ComponentChildren } from "preact";
import { Header } from "./components/header";

interface LayoutProps {
  children?: ComponentChildren;
}
function Layout({ children }: LayoutProps) {
  return (
    <div class="mx-auto flex max-w-[366px] flex-col gap-6 rounded-[38px] bg-neutral-900 p-5 shadow-lg">
      <main>{children}</main>
      <footer class="flex hidden flex-col items-center justify-end sm:flex">
        <p class="flex items-center gap-2 text-slate-500 text-sm leading-0">
          Powered by <img src="/footer-logo.svg" alt="Powered by idOS" />
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Header
        badgeProps={{ children: "Disconnected", color: "primary" }}
        icon={<DisconnectedIcon class="text-slate-500" size="lg" />}
      />
    </Layout>
  );
}
