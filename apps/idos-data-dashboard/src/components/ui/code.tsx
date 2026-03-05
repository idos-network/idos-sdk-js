import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const codeVariants = cva(
  "text-[1em] ",
  {
    variants: {
      variant: {
        solid: "overflow-x-auto max-w-full px-4 py-2 whitespace-pre bg-hover-subtle rounded-lg",
        outline: "border border-border text-card-foreground px-1.5 py-0.5 rounded",
        subtle: "bg-muted/50 text-card-foreground px-1.5 py-0.5 rounded",
        ghost: "text-card-foreground",
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
