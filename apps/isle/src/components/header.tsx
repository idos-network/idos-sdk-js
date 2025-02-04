import IdosLogo from "@/icons/idos-logo";
import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "./common/badge";

export function Header({ icon, badgeProps }: { icon: ReactNode; badgeProps: BadgeProps }) {
  return (
    <>
      <div className="flex w-full items-center gap-1 sm:hidden">
        <IdosLogo />
        {icon}
      </div>
      <div className="flex hidden w-full items-start justify-between gap-2 sm:flex">
        <div className="flex items-center justify-between gap-2">
          <IdosLogo />
          <div className="flex-col gap-1">
            <h2 className="font-semibold text-lg">idOS</h2>
            <Badge {...badgeProps} />
          </div>
        </div>
        {icon}
      </div>
    </>
  );
}
