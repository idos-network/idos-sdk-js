import type { IconProps } from "./icon";
import { Icon } from "./icon";

export function ProfileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg
        viewBox="0 0 26 26"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        aria-labelledby="title"
      >
        <title id="title">Profile icon</title>
        <g clipPath="url(#clip0_2068_18394)">
          <path d="M13 12.502A3.25 3.25 0 1 0 13 6a3.25 3.25 0 0 0 0 6.502M13 13.455A6.545 6.545 0 0 0 6.455 20h13.09A6.545 6.545 0 0 0 13 13.455" />
        </g>
        <defs>
          <clipPath id="clip0_2068_18394">
            <path fill="#fff" d="M6.455 6h13.09v14H6.455z" />
          </clipPath>
        </defs>
      </svg>
    </Icon>
  );
}
