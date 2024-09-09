export function Paragraph({ className, ...other }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-lg text-neutral-500 dark:text-neutral-300 ${className}`} {...other} />;
}
