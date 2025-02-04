import type { JSX } from "preact";
import { tv } from "tailwind-variants";

const button = tv({
  base: "cursor-pointer bg-primary hover:bg-primary-100 disabled:bg-neutral-300 min-h-[40px] text-sm px-4 rounded-md text-neutral-950 grid place-items-center font-medium leading-md w-fit",
  defaultVariants: {
    color: "primary",
  },
});

export function Button({
  class: _class,
  children,
  ...props
}: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={[button({ class: _class as string })].join(" ")} type="button" {...props}>
      {children}
    </button>
  );
}
