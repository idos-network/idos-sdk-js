import { type IconProps, icon } from "./icon";

export function ProfileIcon({
  ariaLabel = "Profile icon",
  class: _class,
  size,
  ...props
}: IconProps) {
  return (
    <svg
      // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
      className={icon({ size, class: _class })}
      viewBox="0 0 26 26"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      fill="currentColor"
      {...props}
    >
      <title>{ariaLabel}</title>
      <g clipPath="url(#clip0_2068_18394)">
        <path d="M13 12.502A3.25 3.25 0 1 0 13 6a3.25 3.25 0 0 0 0 6.502M13 13.455A6.545 6.545 0 0 0 6.455 20h13.09A6.545 6.545 0 0 0 13 13.455" />
      </g>
      <defs>
        <clipPath id="clip0_2068_18394">
          <path fill="#fff" d="M6.455 6h13.09v14H6.455z" />
        </clipPath>
      </defs>
    </svg>
  );
}
