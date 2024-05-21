import React from "preact/compat";

export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", children, className, ...others }: ButtonProps) {
  let variantStyle = "bg-green-200 hover:bg-green-400";

  if (variant === "secondary") {
    variantStyle = "bg-slate-200 hover:bg-slate-400";
  }

  return (
    <button
      className={`rounded-md px-5 py-3 font-semibold transition text-neutral-950 ${variantStyle} ${className}`}
      {...others}
    >
      {children}
    </button>
  );
}
