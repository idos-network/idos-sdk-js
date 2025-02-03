import type { ButtonHTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const buttonVariants = tv({
  base: "min-h-[40px] text-sm px-4 rounded-md text-[#0B0B0B] grid place-items-center font-medium leading-md w-fit",
  variants: {
    color: {
      primary: "bg-[#00FFB9]",
      secondary: "bg-[#B0CCFB]",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

interface ButtonProps extends ButtonHTMLAttributes {
  text: string;
  variant: "primary" | "secondary";
}

export function Button({ text, variant, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ color: variant })} type="button" {...props}>
      {text}
    </button>
  );
}
