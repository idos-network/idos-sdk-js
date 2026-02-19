import type { HTMLAttributes } from "preact/compat";
import { tv } from "tailwind-variants";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const heading = tv({
  base: "font-medium text-lg text-foreground text-center",
});

export function Heading({ as: Component = "h1", class: _class, className, ...rest }: HeadingProps) {
  return (
    <Component
      className={heading({
        // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
        class: _class,
        // @ts-ignore
        className,
      })}
      {...rest}
    />
  );
}
