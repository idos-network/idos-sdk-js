import { tv } from "tailwind-variants";

const stepOutterCircleVariants = tv({
  base: "relative h-6 w-6 rounded-full ",
  variants: {
    active: {
      on: "bg-emerald-900",
      off: "bg-neutral-800",
    },
  },
});

const stepInnerCircleVariants = tv({
  base: "-translate-x-1/2 -translate-y-1/2 absolute absolute top-1/2 left-1/2 h-2 w-2 rounded-full",
  variants: {
    active: {
      on: "bg-teal-400",
      off: "bg-neutral-500",
    },
  },
});

const StepCircle = ({ active }: { active: boolean }) => (
  <div className={stepOutterCircleVariants({ active: active ? "on" : "off" })}>
    <div className={stepInnerCircleVariants({ active: active ? "on" : "off" })} />
  </div>
);

interface Step {
  index?: number;
  title: string;
  description: string;
  render: React.ReactNode;
}

export function Stepper({
  index = -1, // stepper starts with index -1 to hide the title
  steps,
}: { steps: Step[]; index: number }) {
  // showing the current step will hide the stepper general title and make the stepper horizontal
  const currentStep = steps[index];

  return (
    <>
      {currentStep && (
        <div className="my-6 flex w-full justify-center">
          <h2 className="text-center font-semibold text-lg leading-md">{currentStep?.title}</h2>
        </div>
      )}
      <div
        className={`relative mx-auto flex max-w-[206px] ${currentStep ? "flex-row justify-between" : "flex-col"} items-start gap-5.5`}
      >
        <div
          className={`absolute ${currentStep ? "top-[12px] left-0 min-h-[1px] w-full" : "left-[12px] h-full min-w-[1px]"} bg-neutral-500`}
        />
        {steps.map((step, index) => (
          <div key={step.index} className="flex items-center gap-2">
            <StepCircle active={!index} />
            {!currentStep && (
              <span className="text-center font-semibold text-black text-sm leading-none dark:text-neutral-50">
                {step.title}
              </span>
            )}
          </div>
        ))}
      </div>
      {currentStep?.render}
    </>
  );
}
