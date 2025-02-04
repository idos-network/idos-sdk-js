import type { ButtonHTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const buttonVariants = tv({
  base: "cursor-pointer hover:brightness-105 active:brightness-75 min-h-[40px] text-sm px-4 rounded-md text-[#0B0B0B] grid place-items-center font-medium leading-md w-fit",
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
  text: string | React.ReactNode;
  variant?: "primary" | "secondary";
}

export function Button({ text, variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={[buttonVariants({ color: variant }), className].join(" ")}
      type="button"
      {...props}
    >
      {text}
    </button>
  );
}
