import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";

const optionButtonVariants = cva(
  "flex cursor-pointer flex-col gap-6 rounded-2xl border p-6 bg-[#1E1E1E]",
  {
    variants: {
      variant: {
        default: "border-[#88888880]",
        active: "border-[#74FB5B]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface OptionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof optionButtonVariants> {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  topPart?: React.ReactNode
}

export const OptionButton = ({ 
  children, 
  selected, 
  onClick, 
  className,
  topPart,
  ...props 
}: OptionButtonProps) => (
  <button
    type="button"
    className={cn(optionButtonVariants({ 
      variant: selected ? "active" : "default", 
      className 
    }))}
    onClick={onClick}
    {...props}
  >
    {topPart}
     <div className="flex justify-between">
      <div className="flex items-center gap-4 w-full">
        <Checkbox checked={selected} onCheckedChange={() => onClick()} />
        {children}
      </div>
    </div>
  </button>
);