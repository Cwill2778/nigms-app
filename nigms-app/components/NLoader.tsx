'use client';

/**
 * NLoader — Branded loading spinner (Requirement 1.4)
 *
 * Renders the "N" logo icon with a pulsing Precision Coral dot animation.
 * Used in place of a generic spinner whenever the platform is loading data
 * or processing a request.
 */

interface NLoaderProps {
  /** Visual size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label for screen readers */
  label?: string;
}

const sizeMap = {
  sm: { container: 32, n: 20, dot: 6 },
  md: { container: 56, n: 36, dot: 10 },
  lg: { container: 80, n: 52, dot: 14 },
};

export default function NLoader({ size = 'md', label = 'Loading…' }: NLoaderProps) {
  const { container, n, dot } = sizeMap[size];

  return (
    <div
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
      style={{ width: container, height: container }}
    >
      {/* Centered wrapper — positions the "N" and the nail-head dot */}
      <div className="relative flex items-center justify-center">
        {/* Bold geometric "N" in Trust Navy */}
        <svg
          width={n}
          height={n}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Geometric "N" letterform */}
          <path
            d="M6 4H13L20 24L27 4H34V36H28V16L21 36H19L12 16V36H6V4Z"
            fill="#1B263B"
          />
        </svg>

        {/* Precision Coral nail-head dot — pulsing animation (Requirement 1.4) */}
        <span
          className="absolute animate-pulse rounded-full"
          style={{
            width: dot,
            height: dot,
            backgroundColor: '#FF7F7F',
            bottom: 0,
            right: 0,
            transform: 'translate(25%, 25%)',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
