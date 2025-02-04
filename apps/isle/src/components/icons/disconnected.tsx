import { type IconProps, icon } from "./icon";

export function DisconnectedIcon({
  ariaLabel = "Disconnected icon",
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
      <path d="M15.0591 13.5548L8.44568 19.9345H20.2507C20.2507 16.7904 18.0229 14.1666 15.0591 13.5548Z" />
      <path d="M13.0433 13.8214L19.8733 7.27696C20.1141 7.04659 20.1227 6.6635 19.8915 6.42278C19.6611 6.18205 19.278 6.17343 19.0373 6.40466L16.8802 8.47196C16.5368 7.05349 15.2599 6 13.7361 6C11.9493 6 10.5006 7.44866 10.5006 9.23555C10.5006 10.711 11.4885 11.9551 12.8388 12.3443L11.1624 13.9508C9.72148 14.572 8.54978 15.6972 7.86988 17.1061L5.93545 18.9594C5.69473 19.1898 5.6861 19.5729 5.91733 19.8136C6.03554 19.9379 6.1943 20 6.35392 20C6.50405 20 6.65504 19.9439 6.77152 19.8318L7.24952 19.3736C7.24866 19.3874 7.24607 19.4012 7.24521 19.415L13.0433 13.8214Z" />
    </svg>
  );
}
