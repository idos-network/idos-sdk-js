import { tv } from "tailwind-variants";

export interface IconProps {
  variant?: "primary" | "error" | "warning" | "success";
  size?: "sm" | "lg";
  className?: string;
}

export const iconVariants = tv({
  base: "min-w-6.5 min-h-6.5",
  variants: {
    size: {
      sm: "w-6.5 h-6.5",
      lg: "w-8 h-8",
    },
    colors: {
      primary: "fill-[#7A7A7A]",
      error: "fill-[#E23636]",
      warning: "fill-[#FFBB33]",
      success: "fill-[#00FFB9]",
    },
  },
  defaultVariants: {
    size: "sm",
    colors: "primary",
  },
});

const ProfileIcon = ({ variant, size }: IconProps) => {
  return (
    <svg
      className={iconVariants({ size, colors: variant })}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 26 26"
    >
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
};

export default ProfileIcon;
