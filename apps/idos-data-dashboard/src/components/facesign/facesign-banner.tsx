import { Button } from "@/components/ui/button";

const darkGridBackground = {
  backgroundImage: [
    "linear-gradient(to right, rgba(0, 255, 185, 0.07) 1px, transparent 1px)",
    "linear-gradient(to bottom, rgba(0, 255, 185, 0.07) 1px, transparent 1px)",
    "radial-gradient(ellipse at center, #00624D, rgba(0, 0, 0, 0.2))",
    "linear-gradient(to right, #1a1a1a, #003d30)",
  ].join(", "),
  backgroundSize: "24px 24px, 24px 24px, 100% 100%, 100% 100%",
} satisfies React.CSSProperties;

export function FacesignBanner() {
  return (
    <div className="relative flex min-h-[120px] items-center gap-6 overflow-hidden rounded-xl border border-border bg-muted p-5 lg:gap-10 dark:border-[#003d30]">
      <div className="absolute inset-0 hidden dark:block" style={darkGridBackground} />
      <img
        src="/facesign-logo-light.svg"
        alt="idOS FaceSign"
        width={130}
        height={61}
        className="relative hidden shrink-0 lg:block dark:hidden"
      />
      <img
        src="/facesign-logo.svg"
        alt="idOS FaceSign"
        width={130}
        height={61}
        className="relative hidden shrink-0 lg:dark:block"
      />
      <div className="relative flex flex-1 flex-col gap-1">
        <h2 className="text-lg lg:text-xl dark:text-white">One Look. Full Control.</h2>
        <p className="text-muted-foreground text-sm dark:text-neutral-400">
          Create your idOS FaceSign wallet to access your data without passwords. Your face, your
          control.
        </p>
      </div>
      <Button size="lg" className="relative min-w-[130px] shrink-0">
        Create
      </Button>
    </div>
  );
}
