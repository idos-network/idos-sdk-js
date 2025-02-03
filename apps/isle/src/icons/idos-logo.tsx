import { tv } from "tailwind-variants";

const logoVariants = tv({
  base: "aspect-square rounded-full bg-black grid place-items-center", // bg-black could be turned to theme-compatible color
  variants: {
    size: {
      sm: "w-8 h-8",
      lg: "w-16 h-16",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const IdosLogo = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div className={logoVariants({ size })}>
    <img src={`/idos-logo-${size}.svg`} alt="Idos Logo" />
  </div>
);

export default IdosLogo;
