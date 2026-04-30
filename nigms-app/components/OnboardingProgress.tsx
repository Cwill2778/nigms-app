/**
 * OnboardingProgress — step progress indicator for the onboarding flow
 *
 * Shows step dots and a "Step X of Y" label.
 * Active/completed steps use precision-coral (#FF7F7F).
 * Inactive steps use steel-gray (#778DA9).
 * Label text is in trust-navy (#1B263B).
 *
 * Requirements: 2.7
 */

interface OnboardingProgressProps {
  /** Current step (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Step dots */}
      <div className="flex items-center gap-2" role="list" aria-label="Onboarding progress">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center gap-2" role="listitem">
              {/* Dot */}
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 12 : 10,
                  height: isActive ? 12 : 10,
                  backgroundColor:
                    isActive || isCompleted ? '#FF7F7F' : '#778DA9',
                  opacity: isCompleted ? 0.7 : 1,
                }}
                aria-label={
                  isCompleted
                    ? `Step ${stepNum} completed`
                    : isActive
                    ? `Step ${stepNum} current`
                    : `Step ${stepNum}`
                }
              />
              {/* Connector line between dots */}
              {i < totalSteps - 1 && (
                <div
                  className="h-px w-8 transition-colors duration-300"
                  style={{
                    backgroundColor: stepNum < currentStep ? '#FF7F7F' : '#778DA9',
                    opacity: 0.4,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* "Step X of Y" label */}
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#1B263B' }}
        aria-live="polite"
      >
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
