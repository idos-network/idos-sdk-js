import { tv } from "tailwind-variants";

const badgeVariants = tv({
  base: "min-h-[21px] text-xs rounded-sm grid place-items-center font-semibold leading-sm w-fit px-1",
  variants: {
    color: {
      // @todo: add theme-compatible colors also hover, active and disabled
      primary: "bg-[#7A7A7A33] text-[#7A7A7A]",
      success: "bg-[#00FFB933] text-[#00FFB9]",
      error: "bg-[#E2363633] text-[#E23636]",
      warning: "bg-[#FFBB3333] text-[#FFBB33]",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "error" | "warning";
}

export function Badge({
  variant,
  text,
}: {
  text: string;
  variant?: "primary" | "success" | "error" | "warning";
}) {
  return <span className={badgeVariants({ color: variant })}>{text.toUpperCase()}</span>;
}
