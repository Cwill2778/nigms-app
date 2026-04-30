'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Quote, Invoice } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Quote Row ────────────────────────────────────────────────────────────────

interface QuoteRowProps {
  quote: Quote;
  onApproved: () => void;
}

function QuoteRow({ quote, onApproved }: QuoteRowProps) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/quotes/${quote.id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to approve quote');
      }
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApproving(false);
    }
  }

  const isApproved = !!quote.approved_at;

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-bg-elevated, #1e2d42)',
        border: '1px solid var(--color-steel-dim, #2a3a52)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: estimate info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--color-text-primary, #f0f4f8)',
            margin: 0,
          }}
        >
          Estimate #{quote.estimate_number}
        </p>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: '0.15rem 0 0',
          }}
        >
          Created {formatDate(quote.created_at)} · Total: {formatCurrency(quote.total_amount)}
        </p>
        {error && (
          <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
            {error}
          </p>
        )}
      </div>

      {/* Right: status badge or approve button */}
      {isApproved ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: 'var(--color-success, #22C55E)',
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          ✓ Approved
        </span>
      ) : (
        <button
          type="button"
          onClick={handleApprove}
          disabled={approving}
          aria-label={`Approve estimate ${quote.estimate_number}`}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'var(--color-coral, #FF7F7F)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: 'none',
            cursor: approving ? 'not-allowed' : 'pointer',
            opacity: approving ? 0.7 : 1,
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {approving ? 'Approving…' : 'Approve'}
        </button>
      )}
    </div>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

interface InvoiceRowProps {
  invoice: Invoice;
  onPaid: () => void;
}

function InvoiceRow({ invoice, onPaid }: InvoiceRowProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/invoices/${invoice.id}/pay`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to initiate payment');
      }
      // The API returns a Stripe client_secret for Stripe Elements.
      // For now we treat a successful response as payment initiated and refresh.
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setPaying(false);
    }
  }

  const isPaid = !!invoice.paid_at;
  const balanceRemaining = invoice.balance_remaining ?? (invoice.total_billed - invoice.amount_paid);
  const hasBalance = balanceRemaining > 0;

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-bg-elevated, #1e2d42)',
        border: '1px solid var(--color-steel-dim, #2a3a52)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: invoice info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--color-text-primary, #f0f4f8)',
            margin: 0,
          }}
        >
          Invoice #{invoice.receipt_number}
        </p>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: '0.15rem 0 0',
          }}
        >
          Total: {formatCurrency(invoice.total_billed)} · Paid: {formatCurrency(invoice.amount_paid)} · Balance:{' '}
          <span
            style={{
              color: hasBalance && !isPaid ? 'var(--color-coral, #FF7F7F)' : 'var(--color-text-muted, #778DA9)',
              fontWeight: hasBalance && !isPaid ? 700 : 400,
            }}
          >
            {formatCurrency(balanceRemaining)}
          </span>
        </p>
        {error && (
          <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
            {error}
          </p>
        )}
      </div>

      {/* Right: status badge or pay button */}
      {isPaid ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: 'var(--color-success, #22C55E)',
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          ✓ Paid
        </span>
      ) : hasBalance ? (
        <button
          type="button"
          onClick={handlePay}
          disabled={paying}
          aria-label={`Pay invoice ${invoice.receipt_number}`}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'var(--color-navy, #1B263B)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: '1px solid var(--color-coral, #FF7F7F)',
            cursor: paying ? 'not-allowed' : 'pointer',
            opacity: paying ? 0.7 : 1,
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {paying ? 'Processing…' : 'Pay Now'}
        </button>
      ) : (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #778DA9)',
            fontStyle: 'italic',
          }}
        >
          No balance
        </span>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary, #a0b0c0)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: 0,
        }}
      >
        {title}
      </h3>
      {count > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '1.25rem',
            height: '1.25rem',
            padding: '0 0.3rem',
            borderRadius: '9999px',
            background: 'var(--color-steel-dim, #2a3a52)',
            color: 'var(--color-text-muted, #778DA9)',
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * QuoteInvoiceHub — lists all quotes and invoices for the authenticated client.
 *
 * Quote rows show an "Approve" button (calls POST /api/client/quotes/[id]/approve)
 * or an "Approved" badge if already approved.
 *
 * Invoice rows show a "Pay Now" button (calls POST /api/client/invoices/[id]/pay)
 * or a "Paid" badge if already paid.
 *
 * Uses brand colors: trust-navy (#1B263B), precision-coral (#FF7F7F),
 * architectural-gray (#F4F5F7).
 *
 * Requirements: 7.5, 7.6
 */
export default function QuoteInvoiceHub() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { createBrowserClient } = await import('@/lib/supabase-browser');
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const [quotesResult, invoicesResult] = await Promise.all([
        supabase.from('quotes').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (quotesResult.error) throw new Error(quotesResult.error.message);
      if (invoicesResult.error) throw new Error(invoicesResult.error.message);

      setQuotes((quotesResult.data ?? []) as unknown as Quote[]);
      setInvoices((invoicesResult.data ?? []) as unknown as Invoice[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        Loading quotes &amp; invoices…
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
        Failed to load: {error}
      </p>
    );
  }

  const hasContent = quotes.length > 0 || invoices.length > 0;

  if (!hasContent) {
    return (
      <p style={{ color: 'var(--color-text-muted, #778DA9)', fontSize: '0.875rem' }}>
        No quotes or invoices yet.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Quotes section */}
      {quotes.length > 0 && (
        <section aria-label="Quotes">
          <SectionHeader title="Estimates / Quotes" count={quotes.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {quotes.map((quote) => (
              <QuoteRow key={quote.id} quote={quote} onApproved={fetchData} />
            ))}
          </div>
        </section>
      )}

      {/* Invoices section */}
      {invoices.length > 0 && (
        <section aria-label="Invoices">
          <SectionHeader title="Invoices" count={invoices.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} onPaid={fetchData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
