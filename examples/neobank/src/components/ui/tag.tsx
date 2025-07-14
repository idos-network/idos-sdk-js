export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-primary-foreground px-3 py-1 font-semibold text-primary text-xs">
      {children}
    </span>
  );
}