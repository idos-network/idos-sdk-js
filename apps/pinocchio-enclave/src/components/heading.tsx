import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const heading = tv({
  base: "font-medium text-lg text-foreground text-center",
});

export function Heading({ as: Component = "h1", className, ...rest }: HeadingProps) {
  return (
    <Component
      className={heading({ class: className })}
      {...rest}
    />
  );
}
