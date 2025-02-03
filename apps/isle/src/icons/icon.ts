import type { SVGProps } from "react";
import { type VariantProps, tv } from "tailwind-variants";

export const icon = tv({
  base: "h-6 w-6",
  variants: {
    size: {
      default: "h-6 w-6",
      lg: "h-[30px] w-[30px]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type BaseVariants = VariantProps<typeof icon>;
export interface IconProps extends SVGProps<SVGSVGElement>, BaseVariants {
  ariaLabel?: string;
}
