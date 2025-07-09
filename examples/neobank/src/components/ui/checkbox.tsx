"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "flex items-center justify-center border border-border-muted transition-all cursor-pointer border border-[#88888888]",
  {
    variants: {
      variant: {
        default: "rounded-full",
        active: "rounded-full border-transparent bg-[#8888884D]",
      },
      size: {
        sm: "min-h-4 min-w-4",
        default: "min-h-5 min-w-5",
        lg: "min-h-6 min-w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CheckboxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof checkboxVariants> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = ({
  className,
  variant,
  size,
  checked,
  onCheckedChange,
  ...props
}: CheckboxProps) => {
  return (
    <div
      className={cn(checkboxVariants({ variant: checked ? "active" : "default", size, className }))}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && (
        <div className="h-3 w-3 rounded-full bg-[#74FB5B]" />
      )}
    </div>
  );
};

// @todo: move this to ./index.ts
export { Checkbox, checkboxVariants }; 