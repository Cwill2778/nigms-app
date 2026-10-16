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
  { id: 'tracker', label: 'Command Center', icon: '🛠️' },
  { id: 'vault', label: 'The Vault', icon: '📜' },
  { id: 'subscription', label: 'Subscriptions', icon: '⚡' },
  { id: 'properties', label: 'Properties & Assets', icon: '🏠' },
  { id: 'billing', label: 'Billing & Receipts', icon: '💳' },
  { id: 'overview', label: 'Overview', icon: '📊' },
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
  const [tab, setTab] = useState('tracker');
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

          {tab === 'overview' && (
            <OverviewTab
              profile={profile}
              properties={properties}
              subscriptions={subscriptions}
              submissions={submissions}
              workOrders={workOrders}
              onSelectTab={setTab}
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
      </div>
    </div>
  );
}

function OverviewTab({ profile, properties, subscriptions, submissions, workOrders, onSelectTab }) {
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const pendingRequests = submissions.filter((s) => s.status === 'new' || s.status === 'viewed');
  const activeWorkOrders = workOrders?.filter((wo) => wo.status !== 'completed' && wo.status !== 'cancelled') || [];

  return (
    <div className="space-y-10">
      {/* 3 STATS PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onSelectTab('properties')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1"
        >
          <span className="text-2xl block mb-1">🏠</span>
          <p className="text-5xl text-brand-gold font-heading font-bold mb-2">{properties.length}</p>
          <p className="text-[#a0a0a0] font-bold uppercase tracking-wider text-xs">Registered Properties</p>
        </div>

        <div
          onClick={() => onSelectTab('subscription')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1"
        >
          <span className="text-2xl block mb-1">⚡</span>
          <p className="text-5xl text-brand-gold font-heading font-bold mb-2">{activeSubscriptions.length}</p>
          <p className="text-[#a0a0a0] font-bold uppercase tracking-wider text-xs">Active Protection Plans</p>
        </div>

        <div
          onClick={() => onSelectTab('tracker')}
          className="bg-[#0A0A0A] border border-white/10 hover:border-brand-gold/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1"
        >
          <span className="text-2xl block mb-1">🛠️</span>
          <p className="text-5xl text-brand-gold font-heading font-bold mb-2">
            {pendingRequests.length + activeWorkOrders.length}
          </p>
          <p className="text-[#a0a0a0] font-bold uppercase tracking-wider text-xs">Active Jobs & Quotes</p>
        </div>
      </div>

      {/* QUICK COMMAND LAUNCHPAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <span>🛠️</span>
              <span>Command Center Dispatch</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-4">
              Real-time dispatch tracking, technician notes, and instant sign-off on out-of-scope work order estimates.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('tracker')}
            className="w-full bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer"
          >
            Launch Command Center →
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-heading font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <span>📜</span>
              <span>The Maintenance Vault</span>
            </h4>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-4">
              Access certified service logs, before/after photos, itemized contractor invoices, and generate certified property dossiers.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('vault')}
            className="w-full bg-[#161616] hover:bg-white/10 border border-white/10 text-white font-heading font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all cursor-pointer"
          >
            Open Upkeep Vault →
          </button>
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTION HIGHLIGHT */}
      {activeSubscriptions.length > 0 && (
        <div>
          <h3 className="text-xl text-white font-heading font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-3">
            Active Property Care Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-[#0A0A0A] border-l-4 border-brand-gold rounded-xl p-6 shadow-md flex justify-between items-center">
                <div>
                  <h4 className="text-lg text-white font-heading font-bold uppercase tracking-wider mb-1">
                    {sub.subscription_tiers?.name || sub.tier_id}
                  </h4>
                  <p className="text-brand-gold font-bold tracking-widest text-xs capitalize">{sub.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${((sub.subscription_tiers?.price_cents || 0) / 100).toFixed(0)}
                    <span className="text-xs text-[#a0a0a0] font-normal">/mo</span>
                  </p>
                  <button
                    onClick={() => onSelectTab('subscription')}
                    className="text-[11px] text-brand-gold hover:underline mt-1 block uppercase font-bold"
                  >
                    View Checklist & Hours
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
