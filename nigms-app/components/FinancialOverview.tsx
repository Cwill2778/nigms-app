'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutstandingInvoice {
  id: string;
  receipt_number: string;
  total_billed: number;
  created_at: string;
  client_id: string;
  work_order_id: string;
  /** Populated by join */
  client_name?: string | null;
  /** Populated by join */
  wo_number?: string | null;
}

interface FinancialData {
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number | null;
  outstandingInvoices: OutstandingInvoice[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function isOverdue(createdAt: string): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(createdAt) < thirtyDaysAgo;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated, #222120)',
        border: '1px solid var(--color-steel-dim, #38352F)',
        borderRadius: '4px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      <span
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #6B6560)',
          fontFamily: 'var(--font-heading, Montserrat), sans-serif',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: accent ?? 'var(--color-text-primary, #F2EDE8)',
          fontFamily: 'var(--font-heading, Montserrat), sans-serif',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #6B6560)',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── FinancialOverview ────────────────────────────────────────────────────────

/**
 * FinancialOverview — Admin Dashboard Financial Section (Requirement 8.4)
 *
 * Displays:
 * - Total revenue (sum of paid invoices)
 * - Total costs (sum of materials)
 * - Profit margin
 * - Outstanding invoices with overdue alerts (unpaid and >30 days old)
 */
export default function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createBrowserClient();

        // Fetch in parallel: paid invoices, all materials, outstanding invoices
        const [paidResult, materialsResult, outstandingResult] = await Promise.all([
          // Total revenue: sum of total_billed where paid_at IS NOT NULL
          supabase
            .from('invoices')
            .select('total_billed')
            .not('paid_at', 'is', null),

          // Total costs: sum of total_cost from materials
          supabase.from('materials').select('total_cost'),

          // Outstanding invoices: unpaid and total_billed > 0
          supabase
            .from('invoices')
            .select(
              'id, receipt_number, total_billed, created_at, client_id, work_order_id'
            )
            .is('paid_at', null)
            .gt('total_billed', 0)
            .order('created_at', { ascending: true }),
        ]);

        if (paidResult.error) throw new Error(paidResult.error.message);
        if (materialsResult.error) throw new Error(materialsResult.error.message);
        if (outstandingResult.error) throw new Error(outstandingResult.error.message);

        const totalRevenue = (paidResult.data ?? []).reduce(
          (sum, row) => sum + (Number(row.total_billed) || 0),
          0
        );

        const totalCosts = (materialsResult.data ?? []).reduce(
          (sum, row) => sum + (Number(row.total_cost) || 0),
          0
        );

        const profitMargin =
          totalRevenue > 0
            ? ((totalRevenue - totalCosts) / totalRevenue) * 100
            : null;

        // Enrich outstanding invoices with client names and WO numbers
        const rawInvoices = (outstandingResult.data ?? []) as OutstandingInvoice[];
        let enrichedInvoices: OutstandingInvoice[] = rawInvoices;

        if (rawInvoices.length > 0) {
          const clientIds = [...new Set(rawInvoices.map((inv) => inv.client_id))];
          const woIds = [...new Set(rawInvoices.map((inv) => inv.work_order_id))];

          const [clientsResult, woResult] = await Promise.all([
            supabase.from('users').select('id, full_name').in('id', clientIds),
            supabase
              .from('work_orders')
              .select('id, wo_number')
              .in('id', woIds),
          ]);

          const clientMap = new Map(
            (clientsResult.data ?? []).map((c: { id: string; full_name: string | null }) => [
              c.id,
              c.full_name,
            ])
          );
          const woMap = new Map(
            (woResult.data ?? []).map((wo: { id: string; wo_number: string | null }) => [
              wo.id,
              wo.wo_number,
            ])
          );

          enrichedInvoices = rawInvoices.map((inv) => ({
            ...inv,
            client_name: clientMap.get(inv.client_id) ?? null,
            wo_number: woMap.get(inv.work_order_id) ?? null,
          }));
        }

        setData({
          totalRevenue,
          totalCosts,
          profitMargin,
          outstandingInvoices: enrichedInvoices,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-muted, #6B6560)',
          fontSize: '0.875rem',
        }}
      >
        Loading financial data…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="alert alert-error"
        role="alert"
        style={{ padding: '1rem 1.25rem', borderRadius: '4px' }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { totalRevenue, totalCosts, profitMargin, outstandingInvoices } = data;
  const overdueCount = outstandingInvoices.filter((inv) => isOverdue(inv.created_at)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          accent="var(--color-status-green, #22C55E)"
          sub="Sum of paid invoices"
        />
        <KpiCard
          label="Total Costs"
          value={formatCurrency(totalCosts)}
          accent="var(--color-precision-coral, #FF7F7F)"
          sub="Sum of all materials"
        />
        <KpiCard
          label="Profit Margin"
          value={profitMargin !== null ? `${profitMargin.toFixed(1)}%` : '—'}
          accent={
            profitMargin !== null && profitMargin >= 0
              ? 'var(--color-status-green, #22C55E)'
              : 'var(--color-precision-coral, #FF7F7F)'
          }
          sub={totalRevenue === 0 ? 'No revenue yet' : undefined}
        />
        <KpiCard
          label="Outstanding"
          value={String(outstandingInvoices.length)}
          accent={
            overdueCount > 0
              ? 'var(--color-status-gold, #F59E0B)'
              : 'var(--color-text-primary, #F2EDE8)'
          }
          sub={
            overdueCount > 0
              ? `${overdueCount} overdue (>30 days)`
              : 'No overdue invoices'
          }
        />
      </div>

      {/* Outstanding Invoices List */}
      <div>
        <h3
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #6B6560)',
            fontFamily: 'var(--font-heading, Montserrat), sans-serif',
            marginBottom: '0.75rem',
          }}
        >
          Outstanding Invoices
        </h3>

        {outstandingInvoices.length === 0 ? (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted, #6B6560)',
              fontStyle: 'italic',
            }}
          >
            No outstanding invoices.
          </p>
        ) : (
          <div
            className="card overflow-hidden"
            style={{ border: '1px solid var(--color-steel-dim, #38352F)' }}
          >
            <table className="table-industrial">
              <thead>
                <tr>
                  {['Receipt #', 'Client', 'Work Order', 'Amount', 'Created', 'Status'].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((inv) => {
                  const overdue = isOverdue(inv.created_at);
                  return (
                    <tr key={inv.id}>
                      <td
                        style={{
                          color: 'var(--color-text-primary, #F2EDE8)',
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {inv.receipt_number}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                        {inv.client_name ?? '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                        {inv.wo_number ?? '—'}
                      </td>
                      <td
                        style={{
                          color: 'var(--color-text-primary, #F2EDE8)',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(inv.total_billed)}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                        {formatDate(inv.created_at)}
                      </td>
                      <td>
                        {overdue ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              borderRadius: '2px',
                              background: 'rgba(245,158,11,0.15)',
                              color: 'var(--color-status-gold, #F59E0B)',
                              border: '1px solid rgba(245,158,11,0.4)',
                            }}
                          >
                            ⚠ Overdue
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              borderRadius: '2px',
                              background: 'rgba(119,141,169,0.15)',
                              color: 'var(--color-steel-bright, #8C8880)',
                              border: '1px solid rgba(119,141,169,0.3)',
                            }}
                          >
                            Unpaid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
