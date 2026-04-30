"use client";

import { useState } from "react";

interface Step {
  title: string;
  description: string;
}

interface ProductTourProps {
  steps: Step[];
  onComplete: () => void;
}

export default function ProductTour({ steps, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 50,
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 51,
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Step indicator */}
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "12px",
          }}
        >
          Step {currentStep + 1} of {steps.length}
        </p>

        {/* Title */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#1B2A4A",
            marginBottom: "12px",
          }}
        >
          {step.title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: "15px",
            color: "#374151",
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          {step.description}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onComplete}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#6B7280",
              padding: "8px 0",
            }}
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            style={{
              backgroundColor: "#1B2A4A",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
