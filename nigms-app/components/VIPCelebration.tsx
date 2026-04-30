"use client";

/**
 * VIPCelebration
 *
 * Full-screen celebratory overlay shown when a user redeems a vip_bypass promo code.
 * Renders in Precision Coral (#FF7F7F) with white text per Requirement 6.7.
 *
 * Requirements: 6.7, 6.8
 */

interface VIPCelebrationProps {
  /** Called when the user dismisses the overlay */
  onComplete?: () => void;
}

export default function VIPCelebration({ onComplete }: VIPCelebrationProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="VIP Access Granted"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-precision-coral"
    >
      {/* Decorative nail icon */}
      <div className="mb-8 text-white" aria-hidden="true">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylised crown / star burst */}
          <circle cx="40" cy="40" r="36" stroke="white" strokeWidth="3" opacity="0.4" />
          <circle cx="40" cy="40" r="24" stroke="white" strokeWidth="3" opacity="0.6" />
          <circle cx="40" cy="40" r="10" fill="white" />
          {/* Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="40"
              y1="40"
              x2={40 + 36 * Math.cos((deg * Math.PI) / 180)}
              y2={40 + 36 * Math.sin((deg * Math.PI) / 180)}
              stroke="white"
              strokeWidth="2"
              opacity="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Headline */}
      <h1 className="font-heading text-4xl font-black text-white text-center px-6 mb-4 tracking-tight">
        VIP Access Granted.
      </h1>

      {/* Body message */}
      <p className="font-body text-xl text-white text-center px-8 max-w-lg leading-relaxed mb-10">
        Welcome to the Elite Standard. Your complimentary full-feature access is now active.
      </p>

      {/* Dismiss button */}
      {onComplete && (
        <button
          onClick={onComplete}
          className="font-body px-8 py-3 bg-white text-precision-coral font-semibold rounded-full text-base hover:bg-opacity-90 transition-opacity focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
        >
          Go to Dashboard
        </button>
      )}
    </div>
  );
}
