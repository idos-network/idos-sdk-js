import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes {
  variant?: "primary" | "secondary";
}

export function Button({ variant, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={[
        "font-semibold text-green-600 underline underline-offset-4 hover:text-green-700",
        className,
      ].join(" ")}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
