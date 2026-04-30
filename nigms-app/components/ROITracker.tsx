'use client';

/**
 * ROITracker — widget showing "Money Spent" and "Money Saved" metrics.
 *
 * Fetches data from GET /api/client/roi and displays two financial metrics
 * using brand colors (trust-navy, precision-coral).
 *
 * This component is intended to be wrapped in a FeatureGate requiring
 * Elite/VIP access in the dashboard page.
 *
 * Requirements: 7.9
 */

import { useState, useEffect } from 'react';

interface ROIData {
  money_spent: number;
  money_saved: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ROITracker() {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchROI() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/client/roi');
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error((json as { error?: string }).error ?? 'Failed to load ROI data');
        }
        const json = (await res.json()) as ROIData;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchROI();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-text-muted, #778DA9)',
          fontSize: '0.875rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            background: 'var(--color-coral, #FF7F7F)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        Loading ROI data…
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
        Failed to load ROI data: {error}
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Money Spent — trust-navy accent */}
      <div
        style={{
          flex: '1 1 160px',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md, 8px)',
          background: 'var(--color-navy, #1B263B)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-steel-gray, #778DA9)',
            margin: 0,
          }}
        >
          Money Spent
        </p>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: '#D4DCEE',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {data ? formatCurrency(data.money_spent) : '—'}
        </p>
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: 0,
          }}
        >
          Total paid for maintenance &amp; subscriptions
        </p>
      </div>

      {/* Money Saved — precision-coral accent */}
      <div
        style={{
          flex: '1 1 160px',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md, 8px)',
          background: 'rgba(255, 127, 127, 0.12)',
          border: '1px solid rgba(255, 127, 127, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-coral, #FF7F7F)',
            margin: 0,
          }}
        >
          Money Saved
        </p>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-coral, #FF7F7F)',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {data ? formatCurrency(data.money_saved) : '—'}
        </p>
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: 0,
          }}
        >
          Estimated savings vs. reactive repairs
        </p>
      </div>
    </div>
  );
}
