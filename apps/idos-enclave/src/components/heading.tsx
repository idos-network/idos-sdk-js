export function Heading({ className, ...other }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`font-bold text-3xl ${className}`} {...other} />;
}
