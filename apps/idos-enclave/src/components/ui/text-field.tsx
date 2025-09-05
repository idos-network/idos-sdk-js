import type { InputHTMLAttributes } from "preact/compat";
import { tv, type VariantProps } from "tailwind-variants";

const textField = tv({
  base: "rounded-md border-2 border-muted bg-muted text-foreground ring-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-12",
});

type TextFieldVariants = VariantProps<typeof textField>;
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, TextFieldVariants {}

export function TextField({ class: class_, className, ...props }: TextFieldProps) {
  return (
    <input
      className={textField({
        // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
        class: class_,
        // @ts-ignore
        className,
      })}
      {...props}
    />
  );
}
