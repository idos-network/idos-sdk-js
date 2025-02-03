import { type IconProps, icon } from "./icon";

export function AuthorizedIcon({
  ariaLabel = "Access Granted icon",
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
      <path d="M13 14.656a3.184 3.184 0 1 0 0-6.368 3.184 3.184 0 0 0 0 6.368M13 15.59A6.41 6.41 0 0 0 6.59 22h12.82A6.41 6.41 0 0 0 13 15.59" />
      <path d="M16.403 14.893a.594.594 0 0 0 .834-.102 5.33 5.33 0 0 0 1.146-3.32 5.39 5.39 0 0 0-5.382-5.382A5.39 5.39 0 0 0 7.62 11.47c0 1.222.4 2.374 1.155 3.332a.59.59 0 0 0 .834.098.594.594 0 0 0 .099-.835 4.15 4.15 0 0 1-.9-2.595 4.2 4.2 0 0 1 4.194-4.194 4.2 4.2 0 0 1 4.194 4.194c0 .948-.308 1.842-.893 2.586a.594.594 0 0 0 .101.835" />
      <path d="M8.072 16.305a.594.594 0 0 0 .08-.837 6.3 6.3 0 0 1-1.435-3.996A6.29 6.29 0 0 1 13 5.189a6.29 6.29 0 0 1 6.283 6.283c0 1.486-.529 2.929-1.488 4.06a.595.595 0 0 0 .906.77 7.47 7.47 0 0 0 1.77-4.83C20.472 7.353 17.12 4 13.001 4c-4.12 0-7.472 3.352-7.472 7.472 0 1.73.606 3.42 1.706 4.753a.594.594 0 0 0 .837.08" />
    </svg>
  );
}
