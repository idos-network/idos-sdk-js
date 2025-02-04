import type { ComponentChildren, ComponentProps } from "preact";
import { type VariantProps, tv } from "tailwind-variants";

const badge = tv({
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

type BaseVariants = VariantProps<typeof badge>;
interface BadgeProps extends ComponentProps<"span">, BaseVariants {
  children: ComponentChildren;
}

export function Badge({ color, class: _class, children }: BadgeProps) {
  return <div className={badge({ color, class: _class as string })}>{children}</div>;
}
