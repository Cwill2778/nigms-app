/**
 * Logo — Nailed It brand logo lockup (Requirement 1.3)
 *
 * Renders:
 *   - Bold geometric "N" in Trust Navy (#1B263B)
 *   - Precision Coral (#FF7F7F) dot representing the nail head
 *   - "NAILED IT" in heavy Montserrat (font-weight 900)
 *   - "General Maintenance & Property Solutions" in lighter tracked-out font
 */

interface LogoProps {
  /** Controls the overall scale of the logo */
  size?: 'sm' | 'md' | 'lg';
  /** When true, renders on a dark background (inverts text colors) */
  inverted?: boolean;
}

const sizeMap = {
  sm: { icon: 28, title: '1rem', tagline: '0.55rem', gap: '0.5rem' },
  md: { icon: 40, title: '1.35rem', tagline: '0.65rem', gap: '0.75rem' },
  lg: { icon: 56, title: '1.75rem', tagline: '0.75rem', gap: '1rem' },
};

export default function Logo({ size = 'md', inverted = false }: LogoProps) {
  const { icon, title, tagline, gap } = sizeMap[size];
  const textColor = inverted ? '#F4F5F7' : '#1B263B';

  return (
    <div
      className="inline-flex items-center"
      style={{ gap }}
      aria-label="Nailed It General Maintenance & Property Solutions"
    >
      {/* ── Icon mark: geometric "N" + nail-head dot ── */}
      <div className="relative flex-shrink-0" style={{ width: icon, height: icon }}>
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Bold geometric "N" in Trust Navy */}
          <path
            d="M6 4H13L20 24L27 4H34V36H28V16L21 36H19L12 16V36H6V4Z"
            fill="#1B263B"
          />
        </svg>

        {/* Precision Coral nail-head dot */}
        <span
          className="absolute rounded-full"
          style={{
            width: Math.round(icon * 0.22),
            height: Math.round(icon * 0.22),
            backgroundColor: '#FF7F7F',
            bottom: 0,
            right: 0,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Wordmark ── */}
      <div className="flex flex-col leading-none">
        {/* "NAILED IT" — heavy Montserrat, font-weight 900 */}
        <span
          style={{
            fontFamily: 'var(--font-heading), Montserrat, sans-serif',
            fontSize: title,
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: textColor,
            lineHeight: 1,
          }}
        >
          Nailed It
        </span>

        {/* Tagline — lighter weight, tracked out */}
        <span
          style={{
            fontFamily: 'var(--font-body), Inter, system-ui, sans-serif',
            fontSize: tagline,
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: inverted ? 'rgba(244,245,247,0.7)' : '#778DA9',
            marginTop: '0.2em',
            lineHeight: 1,
          }}
        >
          General Maintenance &amp; Property Solutions
        </span>
      </div>
    </div>
  );
}
