import { type IconProps, icon } from "./icon";

export function ExclamationMarkIcon({
  ariaLabel = "Exclamation mark icon",
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
      <path
        d="M13.0373 20C13.8188 20 14.4522 19.3665 14.4522 18.5851C14.4522 17.8037 13.8188 17.1702 13.0373 17.1702C12.2559 17.1702 11.6224 17.8037 11.6224 18.5851C11.6224 19.3665 12.2559 20 13.0373 20Z"
        fill="currentColor"
      />
      <path
        d="M13.0001 6C11.8801 6 11.02 6.99266 11.1801 8.10074L12.1921 15.1298C12.2502 15.5319 12.5943 15.8298 13.0001 15.8298C13.406 15.8298 13.7508 15.5312 13.8081 15.1298L14.8201 8.10074C14.9795 6.99266 14.1194 6 13.0001 6Z"
        fill="currentColor"
      />
    </svg>
  );
}
