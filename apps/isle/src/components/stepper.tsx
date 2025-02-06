import type { ComponentChildren } from "preact";
import { type CnOptions, type VariantProps, cn as _cn, tv } from "tailwind-variants";

const cn = (...args: CnOptions) => _cn(args)({ twMerge: true });

const stepper = tv({
  slots: {
    outerCircle: "relative h-6 w-6 rounded-full",
    innerCircle: "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-2 w-2 rounded-full",
    title: "text-center font-semibold text-black text-sm dark:text-neutral-50",
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
        title: "dark:text-neutral-500",
      },
    },
  },
});

export interface StepCircleProps extends VariantProps<typeof stepper> {}

const StepCircle = ({ active }: StepCircleProps) => {
  const { outerCircle, innerCircle } = stepper({ active });
  return (
    <div className={outerCircle()}>
      <div className={innerCircle()} />
    </div>
  );
};

const StepperLine = ({
  activeIndex,
  steps,
  currentStep,
}: { steps: Step[]; activeIndex: number; currentStep: Step }) => {
  const { title } = stepper();
  const active = (index: number) => activeIndex >= index || !index;

  return (
    <>
      <div
        className={cn(
          "relative mx-auto flex items-start gap-5.5",
          currentStep && currentStep.index !== -1 ? "flex-row justify-between gap-15" : "flex-col",
        )}
      >
        <div
          className={cn(
            "absolute",
            currentStep && currentStep.index !== -1
              ? "top-3 left-0 min-h-px w-full"
              : "left-3 h-full min-w-px",
            "bg-neutral-500",
          )}
        />
        {steps.map((step, index) => (
          <div key={step.index} className="flex items-center gap-2">
            <StepCircle active={activeIndex >= index || !index} />
            {activeIndex === -1 && ( // only show title when stepper is not active
              <span className={title({ active: active(index) })}>{step.title}</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

interface Step {
  index?: number;
  title: string;
  description: string;
  render: (stepperLine: JSX.Element) => ComponentChildren;
}

interface StepperProps {
  steps: Step[];
  index: number;
}

export function Stepper({ index: activeIndex = -1, steps }: StepperProps) {
  const currentStep = steps.find((step) => step.index === activeIndex);

  return (
    <>
      {currentStep?.render(
        <StepperLine activeIndex={activeIndex} steps={steps} currentStep={currentStep} />,
      )}
    </>
  );
}
