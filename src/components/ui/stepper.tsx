"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type StepperContextValue = {
  currentStep: number;
  totalSteps: number;
};

const StepperContext = React.createContext<StepperContextValue | null>(null);

function useStepperContext() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("Stepper components must be used within a Stepper");
  }
  return context;
}

type StepperProps = {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
};

function Stepper({ currentStep, children, className }: StepperProps) {
  const steps = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Step
  );

  return (
    <StepperContext.Provider
      value={{ currentStep, totalSteps: steps.length }}
    >
      <div className={cn("w-full", className)}>
        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((_, index) => (
            <React.Fragment key={index}>
              <StepIndicator step={index + 1} />
              {index < steps.length - 1 && <StepConnector step={index + 1} />}
            </React.Fragment>
          ))}
        </div>
        {/* Step content */}
        <div>{steps[currentStep - 1]}</div>
      </div>
    </StepperContext.Provider>
  );
}

type StepIndicatorProps = {
  step: number;
};

function StepIndicator({ step }: StepIndicatorProps) {
  const { currentStep } = useStepperContext();
  const isCompleted = step < currentStep;
  const isCurrent = step === currentStep;

  return (
    <div
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300",
        isCompleted && "bg-primary text-primary-foreground",
        isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
        !isCompleted && !isCurrent && "bg-secondary text-muted-foreground"
      )}
    >
      {isCompleted ? <Check className="w-5 h-5" /> : step}
    </div>
  );
}

type StepConnectorProps = {
  step: number;
};

function StepConnector({ step }: StepConnectorProps) {
  const { currentStep } = useStepperContext();
  const isCompleted = step < currentStep;

  return (
    <div
      className={cn(
        "w-16 md:w-24 h-1 mx-2 rounded-full transition-all duration-300",
        isCompleted ? "bg-primary" : "bg-secondary"
      )}
    />
  );
}

type StepProps = {
  children: React.ReactNode;
  className?: string;
};

function Step({ children, className }: StepProps) {
  return <div className={cn("animate-in fade-in duration-300", className)}>{children}</div>;
}

type StepHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

function StepHeader({ title, description, className }: StepHeaderProps) {
  return (
    <div className={cn("text-center mb-8", className)}>
      <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

type StepFooterProps = {
  children: React.ReactNode;
  className?: string;
};

function StepFooter({ children, className }: StepFooterProps) {
  return (
    <div className={cn("flex justify-between gap-4 mt-8", className)}>
      {children}
    </div>
  );
}

export { Stepper, Step, StepHeader, StepFooter };

