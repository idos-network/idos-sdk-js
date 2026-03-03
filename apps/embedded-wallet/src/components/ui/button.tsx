import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-800 px-6 py-3 text-base text-neutral-50 transition-colors hover:bg-neutral-700"
      {...props}
    />
  );
}
