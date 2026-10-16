import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';
import { toast } from 'sonner';

import { MaintenanceTracker } from '../components/dashboard/MaintenanceTracker';
import { MaintenanceVault } from '../components/dashboard/MaintenanceVault';
import { SubscriptionManager } from '../components/dashboard/SubscriptionManager';
import { PropertyAssetRegistry } from '../components/dashboard/PropertyAssetRegistry';
import { BillingLedger } from '../components/dashboard/BillingLedger';

const TABS = [
  { id: 'welcome', label: 'Welcome Hub', icon: '🏠' },
  { id: 'tracker', label: 'Command Center', icon: '🛠️' },
  { id: 'vault', label: 'The Vault', icon: '📜' },
  { id: 'subscription', label: 'Subscriptions', icon: '⚡' },
  { id: 'properties', label: 'Properties & Assets', icon: '🔑' },
  { id: 'billing', label: 'Billing & Receipts', icon: '💳' },
  { id: 'support', label: 'Customer Service', icon: '📞' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function Dashboard() {
  usePageMeta('My Account | Nailed It Property Solutions', 'Manage your properties, subscriptions, and active maintenance operations.');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tab, setTab] = useState('welcome');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { setLoading(false); return; }
      loadData(session.user.id, session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData(session.user.id, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadData(userId, currentSession) {
    const activeSession = currentSession || session;
    setLoading(true);
    try {
      const [profileRes, propsRes, subsRes, nypsRes, woRes] = await Promise.all([
        supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('customer_properties').select('*').eq('customer_id', userId),
        supabase.from('customer_subscriptions').select('*, subscription_tiers(*)').eq('customer_id', userId),
        supabase.from('name_your_price').select('*').eq('customer_email', activeSession?.user?.email).order('created_at', { ascending: false }),
        supabase.from('work_orders').select('*').eq('customer_id', userId).order('created_at', { ascending: false }),
      ]);

      let userProfile = profileRes.data;

      // Self-healing: if the user profile doesn't exist yet, automatically create it
      if (!userProfile && activeSession?.user) {
        const meta = activeSession.user.user_metadata || {};
        const { data: createdProfile, error: createErr } = await supabase
          .from('customer_profiles')
          .upsert({
            id: userId,
            email: activeSession.user.email,
            first_name: meta.first_name || '',
            last_name: meta.last_name || '',
            role: 'client'
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!createErr && createdProfile) {
          userProfile = createdProfile;
        }
      }

      setProfile(userProfile);
      setProperties(propsRes.data || []);
      setSubscriptions(subsRes.data || []);
      setSubmissions(nypsRes.data || []);
      setWorkOrders(woRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="w-full bg-[#0A0A0A] min-h-screen py-24 flex justify-center items-center">
        <p className="text-brand-gold font-bold font-heading uppercase tracking-widest animate-pulse text-xl">
          Loading Account Operations...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full bg-[#0A0A0A] min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <div className="bg-[#111111] border border-white/10 p-8 md:p-12 rounded-xl shadow-2xl">
            <h1 className="text-3xl text-white font-heading font-bold uppercase tracking-wider mb-4">My Account</h1>
            <div className="h-1 w-16 bg-brand-gold text-[#0A0A0A] mx-auto mb-6"></div>
            <p className="text-[#a0a0a0] leading-relaxed mb-8">
              Sign in to manage your properties, active maintenance operations, and warranty vaults.
            </p>
            <Link to="/login" className="w-full bg-brand-gold text-[#0A0A0A] hover:opacity-90 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:-translate-y-1 inline-block mb-6">
              Sign In
            </Link>
            <p className="text-[#a0a0a0]">
              Don&rsquo;t have an account? <Link to="/signup" className="text-brand-gold hover:text-white font-bold uppercase tracking-wider ml-2">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pending items requiring client sign-off
  const pendingApprovalsCount = [
    ...workOrders.filter((wo) => wo.status === 'pending_approval' || (wo.estimated_cost && !wo.approved && wo.status === 'scheduled')),
    ...submissions.filter((s) => s.status === 'countered')
  ].length;

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* TOP WELCOME BAR */}
        <div className="bg-[#111111] border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                  {profile?.role === 'staff' || profile?.role === 'admin' ? 'Staff Portal' : 'Customer Command Portal'}
                </span>
                {profile?.account_number && (
                  <span className="text-xs text-[#a0a0a0] font-mono">
                    Account: <strong className="text-white">{profile.account_number}</strong>
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl text-white font-heading font-bold uppercase tracking-wider">
                Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
              </h1>
              <p className="text-[#a0a0a0] text-sm mt-1">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/#name-your-price"
                className="bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.25)]"
              >
                + New Request
              </Link>
              <button
                className="bg-[#1a1a1a] hover:bg-[#0A0A0A] border border-white/10 text-white hover:text-brand-gold font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors text-xs cursor-pointer"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION PILLS */}
        <div className="flex overflow-x-auto gap-2 mb-8 border-b border-white/10 pb-4 no-scrollbar">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`font-heading font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-xs cursor-pointer ${
                  isActive
                    ? 'bg-brand-gold text-[#0A0A0A] shadow-[0_4px_12px_rgba(255,95,31,0.25)]'
                    : 'text-[#a0a0a0] hover:text-white bg-[#111111] hover:bg-[#161616] border border-white/10'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.id === 'tracker' && pendingApprovalsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-[#0A0A0A] text-brand-gold' : 'bg-brand-gold text-[#0A0A0A]'}`}>
                    {pendingApprovalsCount}
                  </span>
                )}
                {t.id === 'properties' && properties.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-[#0A0A0A] text-brand-gold' : 'bg-white/10 text-white/70'}`}>
                    {properties.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIVE TAB CONTENT CONTAINER */}
        <div className="bg-[#111111] border border-white/10 p-6 md:p-8 rounded-2xl shadow-xl min-h-[550px]">
          {tab === 'tracker' && (
            <MaintenanceTracker
              workOrders={workOrders}
              submissions={submissions}
              userId={session.user.id}
              onRefresh={() => loadData(session.user.id, session)}
            />
          )}

          {tab === 'vault' && (
            <MaintenanceVault
              properties={properties}
              userProfile={profile}
            />
          )}

          {tab === 'subscription' && (
            <SubscriptionManager
              subscriptions={subscriptions}
              properties={properties}
              userId={session.user.id}
              onRefresh={() => loadData(session.user.id, session)}
            />
          )}

          {tab === 'properties' && (
            <div className="space-y-12">
              <PropertiesTab
                properties={properties}
                userId={session.user.id}
                session={session}
                profile={profile}
                onRefresh={() => loadData(session.user.id, session)}
              />
              <div className="pt-8 border-t border-white/10">
                <PropertyAssetRegistry
                  properties={properties}
                  userId={session.user.id}
                />
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <BillingLedger
              subscriptions={subscriptions}
              profile={profile}
              userEmail={session.user.email}
            />
          )}

          {tab === 'welcome' && (
            <WelcomeTab
              profile={profile}
              properties={properties}
              subscriptions={subscriptions}
              submissions={submissions}
              workOrders={workOrders}
              onSelectTab={setTab}
              onLogout={handleLogout}
            />
          )}

          {tab === 'support' && (
            <SupportTab
              profile={profile}
              session={session}
              onSelectTab={setTab}
              onLogout={handleLogout}
            />
          )}

          {tab === 'settings' && (
            <SettingsTab
              profile={profile}
              userId={session.user.id}
              onRefresh={() => loadData(session.user.id, session)}
            />
          )}
        </div>

        {/* INCONSPICUOUS LEGAL & UTILITY FOOTER */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#444] font-mono select-none">
          <span>Nailed It Property Solutions LLC &bull; Floyd County &bull; Rome, GA</span>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <Link to="/privacy" className="hover:text-[#888] transition-colors">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms" className="hover:text-[#888] transition-colors">Terms of Service</Link>
            <span>&bull;</span>
            <button onClick={handleLogout} className="hover:text-red-400 transition-colors cursor-pointer">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// WELCOME DASHBOARD TAB (Landing Experience upon Sign In)
// ----------------------------------------------------------------------------
function WelcomeTab({ profile, properties, subscriptions, submissions, workOrders, onSelectTab, onLogout }) {
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const primarySub = activeSubscriptions[0] || subscriptions[0];
  const pendingRequests = submissions.filter((s) => s.status === 'new' || s.status === 'viewed');
  const activeWorkOrders = workOrders?.filter((wo) => wo.status !== 'completed' && wo.status !== 'cancelled') || [];
  const pendingApprovalsCount = [
    ...workOrders.filter((wo) => wo.status === 'pending_approval' || (wo.estimated_cost && !wo.approved && wo.status === 'scheduled')),
    ...submissions.filter((s) => s.status === 'countered')
  ].length;

  return (
    <div className="space-y-10">
      {/* 1. HERO GREETING & ACCOUNT STATUS */}
      <div className="bg-gradient-to-r from-[#18140e] via-[#121212] to-[#0d0d0d] border border-brand-gold/30 p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                Verified Client Portal
              </span>
              <span className="text-xs text-green-400 font-mono font-medium flex items-center gap-1.5 bg-green-950/40 px-2.5 py-0.5 rounded-full border border-green-800/40">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Active Service Coverage
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl text-white font-heading font-bold uppercase tracking-wider">
              Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </h2>
            <p className="text-[#a0a0a0] text-sm mt-1 max-w-2xl leading-relaxed">
              Your home upkeep headquarters for active repairs, certified property records, and priority craftsman dispatch in Rome &amp; Floyd County.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/#name-your-price"
              className="bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.25)] flex items-center gap-2"
            >
              <span>🔨</span>
              <span>Name Your Price</span>
            </Link>
            <button
              onClick={onLogout}
              className="bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-[#a0a0a0] hover:text-red-400 font-heading font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              title="Sign out of your account"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onSelectTab('properties')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <span className="text-2xl block mb-1">🏠</span>
          <p className="text-4xl text-brand-gold font-heading font-bold mb-1">{properties.length}</p>
          <p className="text-[#a0a0a0] group-hover:text-white font-bold uppercase tracking-wider text-xs transition-colors">
            Properties Portfolio
          </p>
        </div>

        <div
          onClick={() => onSelectTab('subscription')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <span className="text-2xl block mb-1">⚡</span>
          <p className="text-4xl text-brand-gold font-heading font-bold mb-1">{activeSubscriptions.length}</p>
          <p className="text-[#a0a0a0] group-hover:text-white font-bold uppercase tracking-wider text-xs transition-colors">
            {primarySub ? primarySub.subscription_tiers?.name || 'Active Plan' : 'Protection Plan'}
          </p>
        </div>

        <div
          onClick={() => onSelectTab('tracker')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <span className="text-2xl block mb-1">🛠️</span>
          <p className="text-4xl text-brand-gold font-heading font-bold mb-1">
            {activeWorkOrders.length + pendingRequests.length}
          </p>
          <p className="text-[#a0a0a0] group-hover:text-white font-bold uppercase tracking-wider text-xs transition-colors">
            Active Jobs &amp; Quotes
          </p>
        </div>

        <div
          onClick={() => onSelectTab('support')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <span className="text-2xl block mb-1">📞</span>
          <p className="text-4xl text-brand-gold font-heading font-bold mb-1">24/7</p>
          <p className="text-[#a0a0a0] group-hover:text-white font-bold uppercase tracking-wider text-xs transition-colors">
            Direct Concierge
          </p>
        </div>
      </div>

      {/* 3. QUICK COMMAND LAUNCHPAD (4 Primary Pillars) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>🛠️</span>
                <span>Command Center Dispatch</span>
              </h4>
              {pendingApprovalsCount > 0 && (
                <span className="bg-brand-gold text-[#0A0A0A] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {pendingApprovalsCount} Approval Needed
                </span>
              )}
            </div>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6">
              Track live work orders through Submitted ➔ Scheduled ➔ In Progress ➔ Completed. Sign off on out-of-scope quotes digitally.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('tracker')}
            className="w-full bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            Launch Command Center →
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <span>📜</span>
              <span>The Maintenance Vault</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6">
              Certified service records, before/after photos, itemized labor &amp; parts invoices, and one-click Certified Property Dossier export for home resale or insurance.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('vault')}
            className="w-full bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all cursor-pointer"
          >
            Open Upkeep Vault →
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <span>⚡</span>
              <span>Subscriptions &amp; Preventative Care</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6">
              Manage your membership tier, included craftsman labor hours, and interactive 4-season home weatherization checklists (Spring, Summer, Fall, Winter).
            </p>
          </div>
          <button
            onClick={() => onSelectTab('subscription')}
            className="w-full bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all cursor-pointer"
          >
            Manage Subscription &amp; Checklist →
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <span>🔑</span>
              <span>Properties &amp; Equipment Catalog</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6">
              Add residential addresses, register HVAC, water heaters, and appliances, track serial numbers, and monitor warranty expirations.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('properties')}
            className="w-full bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all cursor-pointer"
          >
            View Portfolio &amp; Assets →
          </button>
        </div>
      </div>

      {/* 4. DEDICATED CUSTOMER SERVICE & DIRECT DISPATCH CARD */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-3xl flex-shrink-0">
              👷
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-heading font-bold uppercase tracking-wider text-white">
                  Customer Service &amp; Direct Dispatch
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-green-950/60 text-green-400 border border-green-800/40 rounded-full font-mono uppercase">
                  Available
                </span>
              </div>
              <p className="text-xs text-[#a0a0a0] max-w-xl leading-relaxed">
                Need to modify an appointment, ask Charles about an upcoming estimate, or report an urgent property repair? Our direct line is always open.
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs">
                <span className="text-[#888]">Direct Dispatch: <strong className="text-white">(706) 237-8184</strong></span>
                <span className="text-[#888]">&bull;</span>
                <span className="text-[#888]">Email: <strong className="text-white">support.nailedit@gmail.com</strong></span>
                <span className="text-[#888]">&bull;</span>
                <span className="text-[#888]">Service: <strong className="text-brand-gold">Mon–Sat 7am–7pm (24/7 Emergency)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <a
              href="tel:7062378184"
              className="flex-1 lg:flex-none text-center bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-5 py-3 rounded-lg transition-all shadow-md"
            >
              📞 Call Charles
            </a>
            <button
              onClick={() => onSelectTab('support')}
              className="flex-1 lg:flex-none text-center bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
            >
              Full Service Desk →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// DEDICATED CUSTOMER SERVICE TAB
// ----------------------------------------------------------------------------
function SupportTab({ profile, session, onSelectTab, onLogout }) {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider flex items-center gap-3">
            <span>Customer Service &amp; Concierge Desk</span>
            <span className="text-xs px-2.5 py-0.5 bg-green-950/40 text-green-400 border border-green-800/40 rounded-full font-mono uppercase tracking-widest">
              Live Support
            </span>
          </h2>
          <p className="text-sm text-[#a0a0a0] mt-1">
            Direct access to Charles Willis and our Rome, GA field operations team.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-[#a0a0a0] hover:text-red-400 font-heading font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* 3 CONTACT CHANNELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-2xl mb-4">
              📞
            </div>
            <h3 className="text-lg font-heading font-bold uppercase text-white mb-1">Direct Phone</h3>
            <p className="text-xs text-[#a0a0a0] mb-4">
              Speak directly with field dispatch or request an on-site consultation.
            </p>
            <p className="text-xl font-heading font-bold text-brand-gold mb-1">(706) 237-8184</p>
            <p className="text-xs text-[#666]">Mon–Sat: 7:00 AM – 7:00 PM EST</p>
          </div>
          <a
            href="tel:7062378184"
            className="mt-6 w-full text-center bg-brand-gold text-[#0A0A0A] hover:opacity-90 font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all block shadow-md"
          >
            Call Dispatch Now
          </a>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-2xl mb-4">
              ✉️
            </div>
            <h3 className="text-lg font-heading font-bold uppercase text-white mb-1">Email Support</h3>
            <p className="text-xs text-[#a0a0a0] mb-4">
              Send photos, project specs, blueprints, or billing inquiries.
            </p>
            <p className="text-sm font-bold text-white mb-1 break-all">support.nailedit@gmail.com</p>
            <p className="text-xs text-[#666]">Avg response: Under 2 hours</p>
          </div>
          <a
            href="mailto:support.nailedit@gmail.com?subject=Nailed%20It%20Client%20Portal%20Inquiry"
            className="mt-6 w-full text-center bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all block"
          >
            Email Support
          </a>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center text-2xl mb-4">
              🚨
            </div>
            <h3 className="text-lg font-heading font-bold uppercase text-white mb-1">Emergency Dispatch</h3>
            <p className="text-xs text-[#a0a0a0] mb-4">
              Immediate priority service for water heater ruptures, pipe freezes, storm punctures, and electrical failures.
            </p>
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">24/7 Priority Window</p>
            <p className="text-xs text-[#666]">Included for Comprehensive Subscribers</p>
          </div>
          <a
            href="tel:7062378184"
            className="mt-6 w-full text-center bg-red-600 hover:bg-red-500 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all block shadow-md"
          >
            Emergency 24/7 Call
          </a>
        </div>
      </div>

      {/* CRAFTSMAN COMMITMENT BANNER */}
      <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8 rounded-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-1 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🔨</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-white font-heading font-bold uppercase tracking-wider text-base mb-1">
            The Nailed It Standard of Service
          </h4>
          <p className="text-xs text-[#a0a0a0] leading-relaxed">
            Every home repair and maintenance visit is personally overseen by Charles Willis. If any job does not meet municipal Georgia building code standards or your complete satisfaction, we return to make it right at zero additional labor cost.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/#name-your-price"
            className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-5 py-3 rounded-lg hover:opacity-90 transition-all shadow-md whitespace-nowrap"
          >
            + New Service Quote
          </Link>
        </div>
      </div>
    </div>
  );
}

function PropertiesTab({ properties, userId, session, profile, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ label: '', address_line1: '', city: 'Rome', state: 'GA', zip: '', area: '', property_type: 'residential' });

  async function addProperty(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!profile) {
        const meta = session?.user?.user_metadata || {};
        await supabase.from('customer_profiles').upsert({
          id: userId,
          email: session?.user?.email || '',
          first_name: meta.first_name || '',
          last_name: meta.last_name || '',
          role: 'client'
        }, { onConflict: 'id' });
      }

      const { error } = await supabase.from('customer_properties').insert({ 
        ...form, 
        customer_id: userId 
      });

      if (error) {
        console.error('Error adding property:', error);
        toast.error(error.message || 'Failed to add property.');
        return;
      }

      toast.success('Property registered successfully!');
      setForm({ label: '', address_line1: '', city: 'Rome', state: 'GA', zip: '', area: '', property_type: 'residential' });
      setAdding(false);
      onRefresh();
    } catch (err) {
      console.error('Exception adding property:', err);
      toast.error(err.message || 'Failed to add property.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProperty(id) {
    if (confirm('Remove this property from your account? Associated maintenance history will be detached.')) {
      const { error } = await supabase.from('customer_properties').delete().eq('id', id);
      if (error) {
        toast.error(error.message || 'Failed to remove property.');
      } else {
        toast.success('Property removed.');
        onRefresh();
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider">
            Properties Portfolio
          </h2>
          <p className="text-xs text-[#a0a0a0] mt-1">
            Registered residential and commercial addresses managed under your account.
          </p>
        </div>
        <button 
          className="border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-[#0A0A0A] font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors text-xs cursor-pointer" 
          onClick={() => setAdding(!adding)}
        >
          {adding ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {adding && (
        <form className="bg-[#0A0A0A] p-6 md:p-8 rounded-xl border border-white/10 mb-8 space-y-4" onSubmit={addProperty}>
          <h3 className="text-lg text-white font-heading font-bold uppercase tracking-wider">New Property Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Label</label>
              <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" placeholder="e.g. Primary Residence, Rental #2" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Street Address</label>
              <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" placeholder="123 Broad St" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">City</label>
              <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" placeholder="Rome" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">State</label>
                <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" placeholder="GA" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">ZIP</label>
                <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" placeholder="30161" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={submitting} className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors text-xs disabled:opacity-50 cursor-pointer">
              {submitting ? 'Saving...' : 'Save Property'}
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 && !adding ? (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-[#a0a0a0] text-sm mb-4">No properties added yet. Add one to start tracking equipment specs and maintenance logs.</p>
          <button className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors text-xs cursor-pointer" onClick={() => setAdding(true)}>
            + Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-md hover:border-brand-gold/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
                  <h4 className="text-lg text-white font-heading font-bold uppercase tracking-wider">{p.label}</h4>
                  <button className="text-red-400 hover:text-red-300 font-bold uppercase text-[11px] tracking-wider border border-red-900/50 hover:bg-red-900/20 px-2.5 py-1 rounded transition-colors cursor-pointer" onClick={() => deleteProperty(p.id)}>
                    Remove
                  </button>
                </div>
                <p className="text-white font-bold text-sm mb-1">{p.address_line1}</p>
                <p className="text-[#a0a0a0] text-xs mb-3">{p.city}, {p.state} {p.zip}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/5">
                {p.area && <span className="bg-[#161616] text-[#a0a0a0] px-2.5 py-0.5 rounded text-[11px] font-mono">{p.area}</span>}
                <span className="bg-[#161616] text-brand-gold px-2.5 py-0.5 rounded text-[11px] font-mono uppercase">{p.property_type || 'Residential'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ profile, userId, onRefresh }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  });
  const [saved, setSaved] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    const { error } = await supabase.from('customer_profiles').upsert({
      id: userId,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) {
      toast.error(error.message || 'Failed to update profile.');
    } else {
      toast.success('Account settings saved!');
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div>
      <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider mb-6 border-b border-white/10 pb-4">
        Account Settings & Contact
      </h2>
      <form className="max-w-2xl bg-[#0A0A0A] p-6 md:p-8 rounded-xl border border-white/10 space-y-6" onSubmit={saveProfile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">First Name</label>
            <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Last Name</label>
            <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-1">Phone Number</label>
          <input className="w-full bg-[#111111] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold" type="tel" placeholder="(706) 555-0192" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" className="bg-brand-gold text-[#0A0A0A] hover:opacity-90 font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors text-xs cursor-pointer shadow-[0_0_15px_rgba(255,95,31,0.2)]">
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
