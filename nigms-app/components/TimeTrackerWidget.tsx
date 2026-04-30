"use client";

// ─── TimeTrackerWidget ────────────────────────────────────────────────────────
// Client-facing read-only widget showing "[X] / [Y] Minutes Used" with a
// visual progress bar.
//
// Requirements: 4.1, 4.4
//   - Displays "[X] / [Y] Minutes Used" label
//   - Visual progress bar: precision-coral fill, architectural-gray background
//   - Warning state (gold) when minutesUsed >= monthlyAllocation
//   - Resets to 0 at month start (handled by the monthly-reset edge function;
//     this component simply renders the current minutesUsed prop)

interface TimeTrackerWidgetProps {
  /** Minutes consumed so far this period */
  minutesUsed: number;
  /** Monthly allocation for the subscription tier */
  monthlyAllocation: number;
}

export default function TimeTrackerWidget({
  minutesUsed,
  monthlyAllocation,
}: TimeTrackerWidgetProps) {
  const isOverage = minutesUsed >= monthlyAllocation && monthlyAllocation > 0;
  const progressPercent =
    monthlyAllocation > 0
      ? Math.min(100, Math.round((minutesUsed / monthlyAllocation) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg" style={{ background: "#F4F5F7" /* architectural-gray */ }}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "#1B263B" /* trust-navy */ }}
        >
          Minutes Used
        </span>
        <span
          className="text-sm font-semibold"
          style={{
            color: isOverage ? "#F59E0B" /* gold */ : "#1B263B" /* trust-navy */,
          }}
          aria-label={`${minutesUsed} of ${monthlyAllocation} minutes used`}
        >
          {minutesUsed} / {monthlyAllocation}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ background: "#E5E7EB" /* architectural-gray track */ }}
        role="progressbar"
        aria-valuenow={minutesUsed}
        aria-valuemin={0}
        aria-valuemax={monthlyAllocation}
        aria-label={`${minutesUsed} of ${monthlyAllocation} minutes used`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: isOverage ? "#F59E0B" /* gold */ : "#FF7F7F" /* precision-coral */,
          }}
        />
      </div>

      {/* Warning message when at or over allocation */}
      {isOverage && (
        <p
          className="text-xs font-medium"
          style={{ color: "#F59E0B" /* gold */ }}
          role="alert"
        >
          You have exceeded your monthly allocation. Overage charges may apply.
        </p>
      )}
    </div>
  );
}
