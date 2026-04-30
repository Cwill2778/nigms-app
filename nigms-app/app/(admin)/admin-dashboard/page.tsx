import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import Link from 'next/link';
import type { UserProfile, WorkOrder, Payment } from '@/lib/types';
import PaymentRow from '@/components/PaymentRow';
import DashboardSummaryCards from '@/components/DashboardSummaryCards';
import KanbanBoard from '@/components/KanbanBoard';
import SchedulingCalendar from '@/components/SchedulingCalendar';
import FinancialOverview from '@/components/FinancialOverview';
import AssetMaterialManagementSection from '@/components/AssetMaterialManagementSection';
import CMSIntegration from '@/components/CMSIntegration';
import EmergencyDispatchAlert from '@/components/EmergencyDispatchAlert';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getDashboardData() {
  const supabase = getServiceRoleClient();
  const [{ data: clients }, { data: workOrders }, { data: payments }] = await Promise.all([
    supabase.from('users').select('id').eq('role', 'client'),
    supabase
      .from('work_orders')
      .select('id, client_id, wo_number, title, status, urgency, property_address, quoted_amount, inspection_notes, accepted_at, completed_at, total_billable_minutes, created_at, updated_at, property_id, description, category')
      .order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
  ]);

  let unreadMessages = 0;
  try {
    const { count, error } = await supabase
      .from('messages').select('id', { count: 'exact', head: true })
      .eq('sender_role', 'client').is('read_at', null);
    if (!error && count !== null) unreadMessages = count;
  } catch { /* messages table may not exist yet */ }

  const safeClients = (clients ?? []) as Pick<UserProfile, 'id'>[];
  const safeWorkOrders = (workOrders ?? []) as WorkOrder[];
  const safePayments = (payments ?? []) as Payment[];

  // Enrich work orders with client names
  let enrichedWorkOrders: (WorkOrder & { client_name?: string | null })[] = safeWorkOrders;
  if (safeWorkOrders.length > 0) {
    const clientIds = [...new Set(safeWorkOrders.map((wo) => wo.client_id))];
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', clientIds);
    const profileMap = new Map(
      (profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name])
    );
    enrichedWorkOrders = safeWorkOrders.map((wo) => ({
      ...wo,
      client_name: profileMap.get(wo.client_id) ?? null,
    }));
  }

  return {
    totalClients: safeClients.length,
    openWorkOrders: safeWorkOrders.filter((wo) => wo.status === 'pending' || wo.status === 'in_progress').length,
    totalRevenue: safePayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    recentPayments: safePayments.slice(0, 5),
    unreadMessages,
    workOrders: enrichedWorkOrders,
  };
}

async function getAdminUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const supabase = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? '';
  } catch { return ''; }
}

async function verifyAdminAuth(): Promise<void> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if ((profile as { role: string } | null)?.role !== 'admin') {
      redirect('/login');
    }
  } catch (err) {
    // If redirect throws (Next.js redirect), re-throw it
    throw err;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  // Verify admin authentication (redirect to /login if not authenticated)
  await verifyAdminAuth();

  const [
    { totalClients, openWorkOrders, totalRevenue, recentPayments, unreadMessages, workOrders },
    adminUserId,
  ] = await Promise.all([getDashboardData(), getAdminUserId()]);

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <h1>Dashboard</h1>

      {/* ── Emergency Dispatch Alert Banner (Requirement 8.9, 11.3) ── */}
      <EmergencyDispatchAlert />

      {/* ── KPI Summary Cards ── */}
      <DashboardSummaryCards
        totalClients={totalClients}
        openWorkOrders={openWorkOrders}
        totalRevenue={totalRevenue}
        unreadMessages={unreadMessages}
        adminUserId={adminUserId}
      />

      {/* ── 1. Project Pipeline — Kanban Board (Requirement 8.1, 8.2) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Project Pipeline</h2>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Drag cards or use &ldquo;Move to&rdquo; to update status
          </span>
        </div>
        <KanbanBoard workOrders={workOrders} />
      </section>

      {/* ── 2. Scheduling Calendar (Requirement 8.3) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Scheduling &amp; Dispatch</h2>
        </div>
        <div className="card">
          <div className="card-body">
            <SchedulingCalendar />
          </div>
        </div>
      </section>

      {/* ── 3. Financial Overview (Requirement 8.4, Task 20) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💰</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Financial Overview</h2>
        </div>
        <div className="card">
          <div className="card-body">
            <FinancialOverview />
          </div>
        </div>
      </section>

      {/* ── 4. Asset & Material Management (Requirement 8.5, Task 20) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🔧</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Asset &amp; Material Management</h2>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Select a work order to log materials
          </span>
        </div>
        <div className="card">
          <div className="card-body">
            <AssetMaterialManagementSection workOrders={workOrders} />
          </div>
        </div>
      </section>

      {/* ── 5. CRM — Client Database (Requirement 8.6, Task 20) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>👥</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>CRM — Client Database</h2>
          <Link
            href="/clients"
            style={{
              marginLeft: 'auto',
              fontSize: '0.78rem',
              color: 'var(--color-accent-orange)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            View Full CRM →
          </Link>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Manage the full client database, property details, subscription status, and
              communication history from the{' '}
              <Link
                href="/clients"
                style={{ color: 'var(--color-accent-orange)', textDecoration: 'underline' }}
              >
                Clients page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. CMS Integration (Requirement 8.7, Task 21) ── */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🖼️</span>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>CMS Integration</h2>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Upload project photos to the public gallery
          </span>
        </div>
        <div className="card">
          <div className="card-body">
            <CMSIntegration workOrders={workOrders} />
          </div>
        </div>
      </section>

      {/* ── Recent Payments ── */}
      <section>
        <h2 className="mb-4" style={{ fontSize: '1.1rem' }}>Recent Payments</h2>
        {recentPayments.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No payments yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="table-industrial">
              <thead>
                <tr>
                  {['Amount', 'Date', 'Status', 'Method'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
