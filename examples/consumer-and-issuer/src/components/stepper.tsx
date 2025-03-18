import { cn } from "@heroui/react";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface StepperProps {
  activeIndex: number;
  steps: Step[];
}
// @todo: make stepper horizontal
export const Stepper = ({ activeIndex, steps, ...props }: StepperProps) => {
  return (
    <div className={cn("flex flex-col space-y-4")} {...props}>
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isUpcoming = index > activeIndex;

        return (
          <div key={step.id} className="relative flex">
            {/* Icon Circle */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-500",
              )}
            >
              <div
                className={cn(
                  "-translate-x-1/2 absolute top-full left-[50%] h-3 w-0.5 bg-gray-500",
                )}
              />
              {isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : step.icon}
            </div>

            {/* Content */}
            <div className={cn("ml-4", isUpcoming && "opacity-50")}>
              <h3 className={cn("font-semibold text-lg", isUpcoming && "text-gray-500")}>
                {step.title}
              </h3>
              <p className="max-w-sm text-gray-600 text-sm">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

Stepper.displayName = "Stepper";

export default Stepper;
