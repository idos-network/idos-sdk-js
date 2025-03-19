export interface Step {
  title: string;
  description: string;
  icon?: React.ReactNode;
}
interface StepperCircleProps extends Step {
  active?: boolean;
  showLine?: boolean;
}

interface StepperProps {
  activeIndex: number;
  steps: Step[];
}

const StepperCircle = ({
  active,
  title,
  description,
  showLine = false,
  icon,
}: StepperCircleProps) => {
  return (
    <div className="group relative flex w-full flex-col items-center justify-center gap-2">
      {showLine && (
        <div className="absolute top-5 right-[calc(-50%+10px)] left-[calc(50%+20px)] block h-0.5 rounded-full bg-gray-500" />
      )}
      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-full p-1 text-center font-medium text-sm ${
          active
            ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
            : "border border-input bg-background "
        }`}
      >
        {icon}
        {/* <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-white" /> */}
      </div>
      <div className="mt-5 flex flex-col items-center text-center">
        <h4 className="whitespace-nowrap font-semibold text-sm transition lg:text-base">{title}</h4>
        <p className="text-gray-400 text-xs transition">{description}</p>
      </div>
    </div>
  );
};

export function Stepper({ activeIndex, steps }: StepperProps) {
  return (
    <div className="flex w-full items-start gap-2">
      {steps.map((step, index) => (
        <StepperCircle
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={index}
          active={activeIndex >= index}
          title={step.title}
          description={step.description}
          showLine={index < steps.length - 1}
          icon={step.icon}
        />
      ))}
    </div>
  );
}
