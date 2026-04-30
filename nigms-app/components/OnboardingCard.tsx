interface OnboardingCardProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Current step (1-based) */
  step?: number;
  /** Total number of steps */
  totalSteps?: number;
}

const maxWidthMap = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

export default function OnboardingCard({
  children,
  maxWidth = 'md',
  step,
  totalSteps,
}: OnboardingCardProps) {
  const showProgress = step !== undefined && totalSteps !== undefined && totalSteps > 0;
  const progressPct = showProgress ? Math.round((step / totalSteps) * 100) : 0;

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
      <div
        className={`w-full ${maxWidthMap[maxWidth]} bg-white rounded-2xl shadow-lg overflow-hidden`}
      >
        {/* Progress bar */}
        {showProgress && (
          <div className="h-1 w-full bg-gray-100">
            <div
              className="h-1 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%`, backgroundColor: '#FF6B00' }}
            />
          </div>
        )}

        <div className="p-8 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
