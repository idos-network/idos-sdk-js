import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "./badge";
import { Logo } from "./logo";

export function Header({ icon, badgeProps }: { icon: ReactNode; badgeProps: BadgeProps }) {
  return (
    <>
      <header id="mini-header" className="flex w-full items-center gap-1 sm:hidden">
        <Logo />
        {icon}
      </header>
      <header className="flex hidden w-full items-start justify-between gap-2 sm:flex">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <div className="flex-col gap-1">
            <span class="font-medium text-sm">idOS</span>
            <Badge {...badgeProps} />
          </div>
        </div>
        {icon}
      </header>
    </>
  );
}
