import type { ComponentChildren, ComponentProps } from "preact";
import { type VariantProps, tv } from "tailwind-variants";

const button = tv({
  base: "inline-flex h-10 place-content-center items-center rounded-md px-4 py-2 font-medium text-neutral-950 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-primary hover:bg-primary/80 focus:ring-primary",
      secondary: "bg-blue-200 hover:bg-blue-200/80 focus:ring-blue-400",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type BaseVarants = VariantProps<typeof button>;

interface ButtonProps extends ComponentProps<"button">, BaseVarants {
  children: ComponentChildren;
  // @todo: add additional props as `loading`, `loadingMessage`, etc.
}

export function Button({
  class: _class,
  variant,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button className={button({ variant, class: _class as string })} type={type} {...props}>
      {children}
    </button>
  );
}
