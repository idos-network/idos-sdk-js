"use client";
import { Children, cloneElement, isValidElement, useState } from "react";
import { CompletedIcon, IdentityVerificationIcon, IdosIcon, WelcomeIcon } from "@/components/icons";

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
  const [activeStep] = useState(1);
  const steps = [
    {
      title: "Welcome",
      icon: <WelcomeIcon />,
    },
    {
      title: "Identity Verification",
      icon: <IdentityVerificationIcon />,
    },
    {
      title: "idOS Setup",
      icon: <IdosIcon />,
    },
    {
      title: "Conclusion",
      icon: <CompletedIcon />,
    },
  ];

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
