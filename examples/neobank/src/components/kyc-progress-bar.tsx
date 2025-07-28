"use client";
import { Children, cloneElement, isValidElement, useMemo } from "react";
import { CompletedIcon, IdentityVerificationIcon, IdosIcon, WelcomeIcon } from "@/components/icons";
import { useAppStore } from "@/stores/app-store";

const StepIcon = ({
  icon,
  showLine,
  isActive,
}: {
  icon: React.ReactNode;
  showLine: boolean;
  isActive: boolean;
}) => {
  const iconWithProps = Children.map(icon, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child, {
        // @ts-ignore
        className: isActive ? "fill-black" : "fill-icon-inactive",
      });
    }
    return child;
  });
  return (
    <div className="flex items-center">
      {showLine && <div className="h-[1px] w-8 bg-divider" />}
      <div
        className={`flex h-[25px] w-[25px] items-center justify-center rounded-full ${
          isActive ? "bg-primary" : "bg-gray-500"
        }`}
      >
        {iconWithProps}
      </div>
    </div>
  );
};

const ProgressStep = ({
  title,
  icon,
  showLine,
  isActive,
}: {
  title: string;
  icon: React.ReactNode;
  showLine: boolean;
  isActive: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <StepIcon icon={icon} showLine={showLine} isActive={isActive} />
      <span
        className={`whitespace-pre font-medium text-sm ${isActive ? "text-primary" : "text-secondary"}`}
      >
        {title}
      </span>
    </div>
  );
};

export const KycProgressBar = () => {
  const { currentStep } = useAppStore();
  const steps = useMemo(
    () => [
      {
        title: "Welcome",
        icon: <WelcomeIcon />,
        isActive: currentStep === "select-provider",
      },
      {
        title: "Identity Verification",
        icon: <IdentityVerificationIcon />,
        isActive: currentStep === "kyc-flow",
      },
      {
        title: "idOS Setup",
        icon: <IdosIcon />,
        isActive: currentStep === "credential-check",
      },
      {
        title: "Conclusion",
        icon: <CompletedIcon />,
        isActive: currentStep === "complete",
      },
    ],
    [currentStep],
  );

  const activeStep = useMemo(() => steps.findIndex((step) => step.isActive), [steps]);

  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-black p-4">
      {steps.map((step, index) => (
        <ProgressStep
          key={step.title}
          {...step}
          showLine={!!index}
          isActive={activeStep >= index}
        />
      ))}
    </div>
  );
};
