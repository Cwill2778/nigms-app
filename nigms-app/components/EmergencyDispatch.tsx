'use client';

/**
 * EmergencyDispatch — click-to-call button showing Charles's phone number.
 *
 * On click: initiates a tel: call AND calls POST /api/client/emergency-dispatch
 * to send an in-app alert to the admin dashboard with client name, property,
 * and timestamp.
 *
 * Shows a confirmation message after activation.
 *
 * This component is intended to be wrapped in a FeatureGate requiring
 * Elite/VIP access in the dashboard page.
 *
 * Requirements: 7.9, 8.9
 */

import { useState } from 'react';

// Charles's contact phone number — update this to the real number
const CHARLES_PHONE = '+17703000000';
const CHARLES_PHONE_DISPLAY = '(770) 300-0000';

export default function EmergencyDispatch() {
  const [activated, setActivated] = useState(false);
  const [sending, setSending] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  async function handleDispatch() {
    if (sending) return;

    setSending(true);
    setAlertError(null);

    // Fire the admin alert (non-blocking — call still proceeds regardless)
    try {
      const res = await fetch('/api/client/emergency-dispatch', {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('[EmergencyDispatch] Alert failed:', (data as { error?: string }).error);
        setAlertError('Alert notification could not be sent, but your call will still connect.');
      }
    } catch (err) {
      console.warn('[EmergencyDispatch] Alert request failed:', err);
      setAlertError('Alert notification could not be sent, but your call will still connect.');
    } finally {
      setSending(false);
      setActivated(true);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #a0b0c0)',
          margin: 0,
        }}
      >
        24/7 emergency contact line. Tap below to reach Charles immediately for urgent property
        issues. Activating this will also alert the admin dashboard.
      </p>

      {/* Click-to-call button */}
      <a
        href={`tel:${CHARLES_PHONE}`}
        onClick={handleDispatch}
        aria-label={`Call Charles at ${CHARLES_PHONE_DISPLAY} for emergency dispatch`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.75rem',
          borderRadius: 'var(--radius-md, 8px)',
          background: 'var(--color-error, #EF4444)',
          color: '#fff',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1rem',
          letterSpacing: '0.04em',
          textDecoration: 'none',
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.8 : 1,
          transition: 'opacity 0.15s ease, background-color 0.15s ease',
          alignSelf: 'flex-start',
          border: 'none',
        }}
        onMouseEnter={(e) => {
          if (!sending) {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#DC2626';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-error, #EF4444)';
        }}
      >
        {/* Phone icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        🚨 {sending ? 'Connecting…' : `Call ${CHARLES_PHONE_DISPLAY}`}
      </a>

      {/* Confirmation message after activation */}
      {activated && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#22C55E',
              margin: 0,
              fontFamily: 'var(--font-heading)',
            }}
          >
            ✓ Emergency Dispatch Activated
          </p>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-secondary, #a0b0c0)',
              margin: 0,
            }}
          >
            Charles has been alerted. Your call should connect momentarily.
          </p>
        </div>
      )}

      {/* Non-fatal alert error */}
      {alertError && (
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: 0,
          }}
        >
          ⚠️ {alertError}
        </p>
      )}
    </div>
  );
}
