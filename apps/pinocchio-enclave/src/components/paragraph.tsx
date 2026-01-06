import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {}

const text = tv({
  base: "text-sm text-center",
});

export function Paragraph({ className, ...rest }: ParagraphProps) {
  return (
    <p
      className={text({ class: className })}
      {...rest}
    />
  );
}
