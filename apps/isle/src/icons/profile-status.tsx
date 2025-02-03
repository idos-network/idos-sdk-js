export interface IconProps {
  fill?: string;
  size?: "sm" | "lg";
}

const ProfileStatus = ({ fill, size }: IconProps) => {
  const width = size === "sm" ? 26 : 30;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={width}
      fill="none"
      viewBox="0 0 26 26"
    >
      <g fill={fill} clipPath="url(#clip0_2068_18394)">
        <path d="M13 12.502A3.25 3.25 0 1 0 13 6a3.25 3.25 0 0 0 0 6.502M13 13.455A6.545 6.545 0 0 0 6.455 20h13.09A6.545 6.545 0 0 0 13 13.455" />
      </g>
      <defs>
        <clipPath id="clip0_2068_18394">
          <path fill="#fff" d="M6.455 6h13.09v14H6.455z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ProfileStatus;
