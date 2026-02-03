import { NavLink, type NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const linkVariants = cva(
  "inline-flex items-center justify-start whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-foreground hover:text-foreground/80",
        primary: "text-primary hover:text-primary/80",
        secondary: "text-secondary-foreground hover:text-secondary-foreground/80",
        muted: "text-muted-foreground hover:text-muted-foreground/80",
        ghost: "hover:bg-muted hover:text-foreground",
        nav: "px-6 py-3 rounded-xl [&:hover]:!bg-neutral-950 [&:active]:!bg-neutral-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface LinkProps
  extends NavLinkProps,
  VariantProps<typeof linkVariants> {
  className?: string;
}

function Link({ className, variant, ...props }: LinkProps) {
  return (
    <NavLink
      className={({ isActive }) => cn(
        linkVariants({ variant }),
        isActive && "bg-neutral-950!",
        className
      )}
      {...props}
    />
  );
}

export { Link, linkVariants };

