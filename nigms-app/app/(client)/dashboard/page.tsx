import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase';
import DashboardSummary from '@/components/DashboardSummary';
import WorkOrderCard from '@/components/WorkOrderCard';
import PayBalanceButton from '@/components/PayBalanceButton';
import DashboardProductTour from '@/components/DashboardProductTour';
import PaymentStatusToast from '@/components/PaymentStatusToast';
import FeatureGate from '@/components/FeatureGate';
import TimeTrackerWidget from '@/components/TimeTrackerWidget';
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

// ─── Dashboard Page ───────────────────────────────────────────────────────────

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
    { data: subscription },
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
    // Fetch the most recent active subscription for this client
    supabase
      .from('subscriptions')
      .select('tier, minutes_used, monthly_allocation_minutes')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const safeWorkOrders: WorkOrder[] = workOrders ?? [];
  const safePayments: Payment[] = payments ?? [];
  const showTour =
    (onboardingState as { tour_complete: boolean } | null)?.tour_complete === false;

  // Current subscription tier — null means no active subscription
  const currentTier =
    (subscription as { tier: string; minutes_used: number; monthly_allocation_minutes: number } | null)
      ?.tier ?? null;
  const minutesUsed =
    (subscription as { tier: string; minutes_used: number; monthly_allocation_minutes: number } | null)
      ?.minutes_used ?? 0;
  const monthlyAllocation =
    (subscription as { tier: string; minutes_used: number; monthly_allocation_minutes: number } | null)
      ?.monthly_allocation_minutes ?? 0;

  // Work orders with an outstanding balance (quoted > paid for that order)
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <Link
          href="/work-orders/new"
          className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
        >
          + New Work Order
        </Link>
      </div>

      <DashboardSummary workOrders={safeWorkOrders} payments={safePayments} />

      {/* ── 1. Active Project Tracker ──────────────────────────────── */}
      <section
        id="active-projects"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
        }}
      >
        <div className="card-header">
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Active Project Tracker
          </h2>
        </div>
        <div className="card-body">
          <ActiveProjectTracker workOrders={activeWorkOrders} />
        </div>
      </section>

      {/* ── 2. Time Tracker Widget ─────────────────────────────────── */}
      {monthlyAllocation > 0 && (
        <section
          id="time-tracker"
          className="card"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-steel-dim)',
          }}
        >
          <div className="card-header">
            <h2
              className="card-header-title"
              style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
            >
              Time Tracker
            </h2>
          </div>
          <div className="card-body">
            <TimeTrackerWidget
              minutesUsed={minutesUsed}
              monthlyAllocation={monthlyAllocation}
            />
          </div>
        </section>
      )}

      {/* ── 3. Before/After Gallery ────────────────────────────────── */}
      <section
        id="gallery"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
        }}
      >
        <div className="card-header">
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Before / After Gallery
          </h2>
        </div>
        <div className="card-body">
          <BeforeAfterGallery />
        </div>
      </section>

      {/* ── 4. Appointment Management ─────────────────────────────── */}
      <section
        id="appointments"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
        }}
      >
        <div className="card-header">
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Appointment Management
          </h2>
        </div>
        <div className="card-body">
          <AppointmentManagement />
        </div>
      </section>

      {/* ── 5. Quote & Invoice Hub ─────────────────────────────────── */}
      <section
        id="billing"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
        }}
      >
        <div className="card-header">
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Quote &amp; Invoice Hub
          </h2>
        </div>
        <div className="card-body">
          <QuoteInvoiceHub />
        </div>
      </section>

      {/* ── 6. Communication Portal ────────────────────────────────── */}
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
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Communication Portal
          </h2>
        </div>
        <div className="card-body" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <ClientMessagingPanel />
        </div>
      </section>

      {/* ── 7. Maintenance Reminders ───────────────────────────────── */}
      <section
        id="maintenance"
        className="card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-steel-dim)',
        }}
      >
        <div className="card-header">
          <h2
            className="card-header-title"
            style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
          >
            Maintenance Reminders
          </h2>
        </div>
        <div className="card-body">
          <MaintenanceReminders />
        </div>
      </section>

      {/* ── 8. Property Management ─────────────────────────────────── */}
      <section id="properties">
        <PropertyManagement />
      </section>

      {/* ── 9. ROI Tracker (Elite / VIP) ──────────────────────────── */}
      <FeatureGate tier={currentTier} feature="ROI_Tracker">
        <section
          id="roi-tracker"
          className="card card-steel"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-steel-dim)',
          }}
        >
          <div className="card-header">
            <h2
              className="card-header-title"
              style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
            >
              ROI Tracker
            </h2>
          </div>
          <div className="card-body">
            <ROITracker />
          </div>
        </section>
      </FeatureGate>

      {/* ── 10. Emergency Dispatch (Elite / VIP) ──────────────────── */}
      <FeatureGate tier={currentTier} feature="Emergency_Dispatch">
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
            <h2
              className="card-header-title"
              style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
            >
              Emergency Dispatch
            </h2>
          </div>
          <div className="card-body">
            <EmergencyDispatch />
          </div>
        </section>
      </FeatureGate>

      {/* ── All Work Orders ────────────────────────────────────────── */}
      <section id="work-orders">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Work Orders
        </h2>
        {safeWorkOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No work orders yet.</p>
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
