import type { IconProps } from "./types";

export function CompletedIcon({ className }: IconProps) {
  return (
    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>Completed Icon</title>
      <path
        d="M4.36104 8.43692L0.49353 4.56941L1.26856 3.7942L4.36104 6.88669L11.006 0.241699L11.7811 1.01691L4.36104 8.43692Z"
        fill="currentColor"
        className={className}
      />
    </svg>
  );
}
