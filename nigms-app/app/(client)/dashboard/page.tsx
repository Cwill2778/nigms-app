import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase';
import DashboardSummary from '@/components/DashboardSummary';
import WorkOrderCard from '@/components/WorkOrderCard';
import PayBalanceButton from '@/components/PayBalanceButton';
import DashboardProductTour from '@/components/DashboardProductTour';
import PaymentStatusToast from '@/components/PaymentStatusToast';
import PropertyManagement from '@/components/PropertyManagement';
import ActiveProjectTracker from '@/components/ActiveProjectTracker';
import BeforeAfterGallery from '@/components/BeforeAfterGallery';
import AppointmentManagement from '@/components/AppointmentManagement';
import QuoteInvoiceHub from '@/components/QuoteInvoiceHub';
import ClientMessagingPanel from '@/components/ClientMessagingPanel';
import MaintenanceReminders from '@/components/MaintenanceReminders';
import ROITracker from '@/components/ROITracker';
import EmergencyDispatch from '@/components/EmergencyDispatch';
import type { WorkOrder, Payment } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [
    { data: workOrders },
    { data: payments },
    { data: onboardingState },
  ] = await Promise.all([
    supabase
      .from('work_orders')
      .select('*')
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('onboarding_states')
      .select('tour_complete')
      .eq('user_id', session.user.id)
      .single(),
  ]);

  const safeWorkOrders: WorkOrder[] = workOrders ?? [];
  const safePayments: Payment[] = payments ?? [];
  const showTour =
    (onboardingState as { tour_complete: boolean } | null)?.tour_complete === false;

  // Work orders with an outstanding balance
  const paidByWorkOrder = safePayments
    .filter((p) => p.status === 'paid')
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.work_order_id] = (acc[p.work_order_id] ?? 0) + p.amount;
      return acc;
    }, {});

  // Active (in-progress) work orders for the project tracker
  const activeWorkOrders = safeWorkOrders.filter(
    (wo) => wo.status === 'in_progress' || wo.status === 'accepted',
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      {showTour && <DashboardProductTour />}

      {/* Payment status toast — reads ?payment= and ?enrolled= query params */}
      <Suspense fallback={null}>
        <PaymentStatusToast />
      </Suspense>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <Link
          href="/work-orders/new"
          className="btn-primary text-sm px-4 py-2"
        >
          + New Work Order
        </Link>
      </div>

      <DashboardSummary workOrders={safeWorkOrders} payments={safePayments} />

      {/* ── 1. Active Project Tracker ──────────────────────────────── */}
      <section
        id="active-projects"
        className="card"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Active Project Tracker
          </h2>
        </div>
        <div className="card-body">
          <ActiveProjectTracker workOrders={activeWorkOrders} />
        </div>
      </section>

      {/* ── 2. Before/After Gallery ────────────────────────────────── */}
      <section
        id="gallery"
        className="card"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Before / After Gallery
          </h2>
        </div>
        <div className="card-body">
          <BeforeAfterGallery />
        </div>
      </section>

      {/* ── 3. Appointment Management ─────────────────────────────── */}
      <section
        id="appointments"
        className="card"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Appointment Management
          </h2>
        </div>
        <div className="card-body">
          <AppointmentManagement />
        </div>
      </section>

      {/* ── 4. Quote & Invoice Hub ─────────────────────────────────── */}
      <section
        id="billing"
        className="card"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Quote &amp; Invoice Hub
          </h2>
        </div>
        <div className="card-body">
          <QuoteInvoiceHub />
        </div>
      </section>

      {/* ── 5. Communication Portal ────────────────────────────────── */}
      <section
        id="messages"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Communication Portal
          </h2>
        </div>
        <div className="card-body" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <ClientMessagingPanel />
        </div>
      </section>

      {/* ── 6. Maintenance Reminders ───────────────────────────────── */}
      <section
        id="maintenance"
        className="card"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Maintenance Reminders
          </h2>
        </div>
        <div className="card-body">
          <MaintenanceReminders />
        </div>
      </section>

      {/* ── 7. Property Management ─────────────────────────────────── */}
      <section id="properties">
        <PropertyManagement />
      </section>

      {/* ── 8. ROI Tracker ────────────────────────────────────────── */}
      <section
        id="roi-tracker"
        className="card card-steel"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            ROI Tracker
          </h2>
        </div>
        <div className="card-body">
          <ROITracker />
        </div>
      </section>

      {/* ── 9. Emergency Dispatch ─────────────────────────────────── */}
      <section
        id="emergency-dispatch"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
          borderTop: '2px solid var(--color-error)',
        }}
      >
        <div className="card-header">
          <h2 className="card-header-title" style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}>
            Emergency Dispatch
          </h2>
        </div>
        <div className="card-body">
          <EmergencyDispatch />
        </div>
      </section>

      {/* ── All Work Orders ────────────────────────────────────────── */}
      <section id="work-orders">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          All Work Orders
        </h2>
        {safeWorkOrders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No work orders yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {safeWorkOrders.map((wo) => {
              const paid = paidByWorkOrder[wo.id] ?? 0;
              const outstanding = Math.max(0, (wo.quoted_amount ?? 0) - paid);
              return (
                <div key={wo.id} className="flex flex-col gap-2">
                  <WorkOrderCard workOrder={wo} />
                  {outstanding > 0 && (
                    <div className="pl-1">
                      <PayBalanceButton workOrderId={wo.id} amount={outstanding} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
