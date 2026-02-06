import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const codeVariants = cva(
  "text-[1em] ",
  {
    variants: {
      variant: {
        solid: "overflow-x-auto max-w-full px-5 py-1 whitespace-pre bg-neutral-950 rounded-xl",
        outline: "border border-neutral-700 text-neutral-100 px-1.5 py-0.5 rounded",
        subtle: "bg-neutral-800/50 text-neutral-200 px-1.5 py-0.5 rounded",
        ghost: "text-neutral-100",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {
  asChild?: boolean;
}

const Code = forwardRef<HTMLElement, CodeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(codeVariants({ variant, size }), className)}
        style={{
          fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
        {...props}
      />
    );
  }
);

Code.displayName = "Code";

export { Code, codeVariants };
