import type { ButtonHTMLAttributes } from "preact/compat";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-800 px-5 py-2 text-neutral-50 transition-colors hover:bg-neutral-700"
      {...props}
    />
  );
}
