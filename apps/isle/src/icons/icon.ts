import type { JSX } from "preact";
import { type VariantProps, tv } from "tailwind-variants";

export const icon = tv({
  base: "",
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

export interface IconProps extends JSX.SVGAttributes<SVGSVGElement>, BaseVariants {
  ariaLabel?: string;
}
