import type { HTMLAttributes } from "preact/compat";
import { tv } from "tailwind-variants";

interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {}

const text = tv({
  base: "text-sm text-center",
});

export function Paragraph({ class: _class, className, ...rest }: ParagraphProps) {
  return (
    <p
      className={text({
        // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
        class: _class,
        // @ts-ignore
        className,
      })}
      {...rest}
    />
  );
}
