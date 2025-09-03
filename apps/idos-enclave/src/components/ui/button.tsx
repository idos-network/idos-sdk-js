import type { ComponentProps } from "preact";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "inline-flex place-content-center items-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-primary px-6 py-3 text-primary-foreground",
      secondary: "bg-secondary px-6 py-3 text-secondary-foreground",
      link: "bg-transparent p-2 text-foreground underline underline-offset-4",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type BaseVariants = VariantProps<typeof button>;
interface ButtonProps extends ComponentProps<"button">, BaseVariants {}

export function Button({
  variant,
  class: _class,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      // @ts-expect-error: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
      className={button({ variant, class: _class, className })}
      {...props}
    />
  );
}
