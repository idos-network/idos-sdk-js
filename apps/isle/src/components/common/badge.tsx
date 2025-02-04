import { tv } from "tailwind-variants";

const badgeVariants = tv({
  base: "min-h-[21px] text-xs rounded-sm grid place-items-center font-medium leading-sm w-fit px-1",
  variants: {
    color: {
      primary: "bg-neutral-500/30 text-neutral-500",
      success: "bg-primary/20 text-primary",
      danger: "bg-danger/20 text-danger",
      warning: "bg-warning/20 text-warning",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "danger" | "warning";
}

export function Badge({
  variant,
  text,
}: {
  text: string;
  variant?: "primary" | "success" | "danger" | "warning";
}) {
  return <span className={badgeVariants({ color: variant })}>{text.toUpperCase()}</span>;
}
