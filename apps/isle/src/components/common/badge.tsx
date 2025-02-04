export interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "error" | "warning";
}

export function Badge({
  text,
}: {
  text: string;
  variant?: "primary" | "success" | "error" | "warning";
}) {
  return (
    <span className="grid min-h-[21px] place-items-center rounded-sm font-semibold text-xs">
      {text.toUpperCase()}
    </span>
  );
}
