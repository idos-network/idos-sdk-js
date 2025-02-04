import { tv, cn as _cn } from "tailwind-variants";

const cn = (...args: any) => _cn(args)({ twMerge: true });

const stepCircleVariants = tv({
  slots: {
    outerCircle: "relative h-6 w-6 rounded-full",
    innerCircle: "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-2 w-2 rounded-full",
  },
  variants: {
    active: {
      on: {
        outerCircle: "bg-emerald-900",
        innerCircle: "bg-teal-400",
      },
      off: {
        outerCircle: "bg-neutral-800",
        innerCircle: "bg-neutral-500",
      },
    },
  },
});

export interface StepCircleProps {
  active: boolean;
}

const StepCircle = ({ active }: StepCircleProps) => {
  const { outerCircle, innerCircle } = stepCircleVariants({ active: active ? "on" : "off" });
  return (
    <div className={outerCircle()}>
      <div className={innerCircle()} />
    </div>
  );
};

interface Step {
  index?: number;
  title: string;
  description: string;
  render: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  index: number;
}

export function Stepper({
  index: activeIndex = -1, // stepper starts with index -1 to hide the title
  steps,
}: StepperProps) {
  // showing the current step will hide the stepper general title and make the stepper horizontal
  const currentStep = steps[activeIndex];

  return (
    <>
      {currentStep && (
        <div className="my-6 flex w-full justify-center">
          <h2 className="text-center font-semibold text-lg leading-md">{currentStep.title}</h2>
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto flex max-w-[206px] items-start gap-5.5",
          currentStep ? "flex-row justify-between" : "flex-col",
        )}
      >
        <div
          className={cn(
            "absolute",
            currentStep ? "top-[12px] left-0 min-h-[1px] w-full" : "left-[12px] h-full min-w-[1px]",
            "bg-neutral-500",
          )}
        />
        {steps.map((step, index) => (
          <div key={step.index} className="flex items-center gap-2">
            <StepCircle active={activeIndex >= index} />
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
