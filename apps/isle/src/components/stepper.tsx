import type { ComponentChildren } from "preact";
import { type CnOptions, type VariantProps, cn as _cn, tv } from "tailwind-variants";

const cn = (...args: CnOptions) => _cn(args)({ twMerge: true });

const stepper = tv({
  slots: {
    outerCircle: "relative h-6 w-6 rounded-full",
    innerCircle: "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-2 w-2 rounded-full",
  },
  variants: {
    active: {
      true: {
        outerCircle: "bg-emerald-900",
        innerCircle: "bg-teal-400",
      },
      false: {
        outerCircle: "bg-neutral-800",
        innerCircle: "bg-neutral-500",
      },
    },
  },
});

export interface StepCircleProps extends VariantProps<typeof stepper> {}

const StepCircle = ({ active }: StepCircleProps) => {
  const { outerCircle, innerCircle } = stepper({ active });
  return (
    <div class={outerCircle()}>
      <div class={innerCircle()} />
    </div>
  );
};

interface Step {
  index?: number;
  title: string;
  description: string;
  render: ComponentChildren;
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
        <div class="my-6 flex w-full justify-center">
          <h2 class="text-center font-semibold text-lg">{currentStep.title}</h2>
        </div>
      )}
      <div
        class={cn(
          "relative mx-auto flex max-w-[206px] items-start gap-5.5",
          currentStep ? "flex-row justify-between" : "flex-col",
        )}
      >
        <div
          className={cn(
            "absolute",
            currentStep ? "top-3 left-0 min-h-px w-full" : "left-3 h-full min-w-px",
            "bg-neutral-500",
          )}
        />
        {steps.map((step, index) => (
          <div key={step.index} className="flex items-center gap-2">
            <StepCircle active={activeIndex >= index} />
            {!currentStep && (
              <span class="text-center font-semibold text-black text-sm dark:text-neutral-50">
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
