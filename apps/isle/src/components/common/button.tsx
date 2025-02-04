import type { ButtonHTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const buttonVariants = tv({
  base: "cursor-pointer bg-aquamarine-400 hover:brightness-105 active:brightness-75 min-h-[40px] text-sm px-4 rounded-md text-neutral-950 grid place-items-center font-medium leading-md w-fit",
  defaultVariants: {
    color: "primary",
  },
});

export function Button({ className, children, ...props }: ButtonHTMLAttributes) {
  return (
    <button className={[buttonVariants(), className].join(" ")} type="button" {...props}>
      {children}
    </button>
  );
}
