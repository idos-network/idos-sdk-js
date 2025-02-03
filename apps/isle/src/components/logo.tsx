import type { JSX } from "preact";
import { type VariantProps, tv } from "tailwind-variants";

const logo = tv({
  slots: {
    wrapper: "grid aspect-square place-content-center rounded-full bg-neutral-950",
    image: "",
  },
  variants: {
    size: {
      sm: {
        wrapper: "h-8 w-8",
        image: "h-4 w-4",
      },
      md: {
        wrapper: "h-10 w-10",
        image: "h-5 w-5",
      },
      lg: {
        wrapper: "h-[60px] w-[60px]",
        image: "h-8 w-8",
      },
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

type BaseVariants = VariantProps<typeof logo>;
interface LogoProps extends JSX.HTMLAttributes<HTMLImageElement>, BaseVariants {}

export function Logo({ size }: LogoProps) {
  const { wrapper, image } = logo({ size });
  return (
    <div class={wrapper()}>
      <img src="/logo.svg" alt="idOS logo" class={image()} />
    </div>
  );
}
