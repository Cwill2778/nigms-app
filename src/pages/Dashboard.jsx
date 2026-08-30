import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';

function Dashboard() {
  usePageMeta('My Account | Nailed It Property Solutions', 'Manage your properties, subscriptions, and service requests.');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { setLoading(false); return; }
      loadData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadData(userId) {
    setLoading(true);
    const [profileRes, propsRes, subsRes, nypsRes, woRes] = await Promise.all([
      supabase.from('customer_profiles').select('*').eq('id', userId).single(),
      supabase.from('customer_properties').select('*').eq('customer_id', userId),
      supabase.from('customer_subscriptions').select('*, subscription_tiers(*)').eq('customer_id', userId),
      supabase.from('name_your_price').select('*').eq('customer_email', session?.user?.email).order('created_at', { ascending: false }),
      supabase.from('work_orders').select('*, properties(*)').eq('customer_id', userId).order('created_at', { ascending: false }),
    ]);
    setProfile(profileRes.data);
    setProperties(propsRes.data || []);
    setSubscriptions(subsRes.data || []);
    setSubmissions(nypsRes.data || []);
    setWorkOrders(woRes.data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) return <div className="w-full bg-wood-900 min-h-screen py-24 flex justify-center items-center"><p className="text-brand-orange font-bold font-heading uppercase tracking-widest animate-pulse text-xl">Loading Account...</p></div>;

  if (!session) {
    return (
      <div className="w-full bg-wood-900 min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
            <h1 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">My Account</h1>
            <div className="h-1 w-16 bg-brand-orange mx-auto mb-6"></div>
            <p className="text-text-sub leading-relaxed mb-8">Sign in to manage your properties, subscriptions, and service requests.</p>
            <Link to="/login" className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:-translate-y-1 inline-block mb-6">Sign In</Link>
            <p className="text-text-sub">Don&rsquo;t have an account? <Link to="/signup" className="text-brand-orange hover:text-brand-hover font-bold uppercase tracking-wider ml-2">Create one</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-wood-900 min-h-screen py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}</h1>
              <p className="text-brand-orange font-bold tracking-widest uppercase text-sm mb-1">{session.user.email}</p>
              {profile?.account_number && <p className="text-text-sub text-sm">Account: {profile.account_number}</p>}
            </div>
            <button className="bg-wood-800 hover:bg-wood-900 border border-border-subtle text-text-main hover:text-brand-orange font-heading font-bold uppercase tracking-wider px-6 py-2 rounded transition-colors" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-border-subtle pb-4">
          {['overview', 'properties', 'requests', 'settings'].map((t) => (
            <button
              key={t}
              className={`font-heading font-bold uppercase tracking-wider px-6 py-3 rounded-t-md transition-colors ${tab === t ? 'bg-brand-orange text-wood-900' : 'text-text-sub hover:text-brand-orange bg-wood-800 border-t border-x border-border-subtle'}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-wood-card border border-border-subtle p-8 rounded-xl shadow-xl min-h-[500px]">
          {tab === 'overview' && <OverviewTab profile={profile} properties={properties} subscriptions={subscriptions} submissions={submissions} />}
          {tab === 'properties' && <PropertiesTab properties={properties} userId={session.user.id} onRefresh={() => loadData(session.user.id)} />}
          {tab === 'requests' && <RequestsTab submissions={submissions} />}
          {tab === 'settings' && <SettingsTab profile={profile} userId={session.user.id} onRefresh={() => loadData(session.user.id)} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ profile, properties, subscriptions, submissions, workOrders }) {
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const pendingRequests = submissions.filter((s) => s.status === 'new' || s.status === 'viewed');
  const activeWorkOrders = workOrders?.filter((wo) => wo.status !== 'completed' && wo.status !== 'cancelled') || [];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-wood-800 border border-border-subtle rounded-lg p-6 text-center">
          <p className="text-5xl text-brand-orange font-heading font-bold mb-2">{properties.length}</p>
          <p className="text-text-sub font-bold uppercase tracking-wider text-sm">Properties</p>
        </div>
        <div className="bg-wood-800 border border-border-subtle rounded-lg p-6 text-center">
          <p className="text-5xl text-brand-orange font-heading font-bold mb-2">{activeSubscriptions.length}</p>
          <p className="text-text-sub font-bold uppercase tracking-wider text-sm">Active Plans</p>
        </div>
        <div className="bg-wood-800 border border-border-subtle rounded-lg p-6 text-center">
          <p className="text-5xl text-brand-orange font-heading font-bold mb-2">{pendingRequests.length + activeWorkOrders.length}</p>
          <p className="text-text-sub font-bold uppercase tracking-wider text-sm">Open Quotes & Work Orders</p>
        </div>
      </div>

      {activeSubscriptions.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 border-b border-border-subtle pb-4">Your Subscriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="bg-wood-800 border-l-4 border-brand-orange rounded-lg p-6 shadow-md flex justify-between items-center">
                <div>
                  <h4 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-1">{sub.subscription_tiers?.name || sub.tier_id}</h4>
                  <p className="text-brand-orange font-bold tracking-widest text-sm capitalize">{sub.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-text-main">${((sub.subscription_tiers?.price_cents || 0) / 100).toFixed(0)}<span className="text-sm text-text-sub font-normal">/mo</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {submissions.length > 0 && (
        <div>
          <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 border-b border-border-subtle pb-4">Recent Requests</h3>
          <div className="space-y-4">
            {submissions.slice(0, 3).map((s) => (
              <div key={s.id} className="bg-wood-800 border border-border-subtle rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${s.status === 'new' ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/50' : 'bg-wood-700 text-text-sub border border-border-subtle'}`}>
                    {s.status}
                  </span>
                  <span className="text-xl font-bold text-brand-orange">${(s.offered_price / 100).toFixed(0)}</span>
                </div>
                <p className="text-text-main leading-relaxed mb-4">{s.description.substring(0, 120)}{s.description.length > 120 ? '...' : ''}</p>
                <p className="text-text-sub text-sm italic">Submitted {new Date(s.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesTab({ properties, userId, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', address_line1: '', city: 'Rome', state: 'GA', zip: '', area: '', property_type: 'residential' });

  async function addProperty(e) {
    e.preventDefault();
    await supabase.from('customer_properties').insert({ ...form, customer_id: userId });
    setForm({ label: '', address_line1: '', city: 'Rome', state: 'GA', zip: '', area: '', property_type: 'residential' });
    setAdding(false);
    onRefresh();
  }

  async function deleteProperty(id) {
    if (confirm('Remove this property?')) {
      await supabase.from('customer_properties').delete().eq('id', id);
      onRefresh();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-border-subtle pb-4">
        <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">My Properties</h2>
        <button 
          className="border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-wood-900 font-heading font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors text-sm" 
          onClick={() => setAdding(!adding)}
        >
          {adding ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {adding && (
        <form className="bg-wood-800 p-8 rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] border border-wood-700/50 mb-8" onSubmit={addProperty}>
          <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">New Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Label</label>
              <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" placeholder="e.g. Primary, Rental #1" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Street Address</label>
              <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" placeholder="123 Main St" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">City</label>
              <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" placeholder="Rome" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">State</label>
                <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" placeholder="GA" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">ZIP</label>
                <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" placeholder="30161" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Area</label>
              <select className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow appearance-none" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                <option value="">Select area (optional)</option>
                <option value="West Rome">West Rome</option>
                <option value="North Rome">North Rome</option>
                <option value="East Rome">East Rome</option>
                <option value="South Rome">South Rome</option>
                <option value="Downtown">Downtown Rome</option>
                <option value="Clocktower Hill">Clocktower Hill</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Type</label>
              <select className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow appearance-none" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="multi-unit">Multi-Unit</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors text-sm">Save Property</button>
        </form>
      )}

      {properties.length === 0 && !adding ? (
        <div className="bg-wood-800 border border-border-subtle rounded-lg p-12 text-center">
          <p className="text-text-sub text-lg mb-6">No properties added yet. Add one to get started with subscriptions and service tracking.</p>
          <button className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors" onClick={() => setAdding(true)}>+ Add Property</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="bg-wood-800 border border-border-subtle rounded-lg p-6 shadow-md hover:border-brand-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4 border-b border-border-subtle pb-4">
                <h4 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider">{p.label}</h4>
                <button className="text-red-400 hover:text-red-300 font-bold uppercase text-xs tracking-wider border border-red-900/50 hover:bg-red-900/20 px-3 py-1 rounded transition-colors" onClick={() => deleteProperty(p.id)}>Remove</button>
              </div>
              <p className="text-text-main font-bold mb-1">{p.address_line1}</p>
              <p className="text-text-sub mb-4">{p.city}, {p.state} {p.zip}</p>
              <div className="flex gap-2">
                {p.area && <span className="bg-wood-700 text-text-sub px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{p.area}</span>}
                <span className="bg-wood-700 text-text-sub px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{p.property_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestsTab({ submissions, workOrders }) {
  const hasItems = submissions.length > 0 || (workOrders && workOrders.length > 0);

  if (!hasItems) {
    return (
      <div className="bg-wood-800 border border-border-subtle rounded-lg p-12 text-center">
        <p className="text-text-sub text-lg mb-6">No requests or work orders yet.</p>
        <Link to="/#name-your-price" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors inline-block">Request a Quote</Link>
      </div>
    );
  }

  return (
    <div>
      {workOrders && workOrders.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 border-b border-border-subtle pb-4">My Work Orders</h2>
          <div className="space-y-6">
            {workOrders.map((wo) => (
              <div key={wo.id} className="bg-wood-800 border border-border-subtle rounded-lg p-6 shadow-md border-l-4 border-l-brand-orange">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-border-subtle pb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-text-main">{wo.title}</h3>
                    <p className="text-sm text-text-sub">{wo.properties?.address_line_1}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    wo.status === 'completed' ? 'bg-green-900/30 text-green-500 border border-green-700/50' : 
                    wo.status === 'scheduled' ? 'bg-blue-900/30 text-blue-500 border border-blue-700/50' :
                    wo.status === 'in_progress' ? 'bg-purple-900/30 text-purple-500 border border-purple-700/50' :
                    'bg-brand-orange/20 text-brand-orange border border-brand-orange/50'
                  }`}>
                    {wo.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-text-main leading-relaxed mb-4">{wo.description}</p>
                {wo.scheduled_date && (
                  <div className="bg-wood-900 p-3 rounded border border-border-subtle flex items-center gap-3">
                    <span className="text-brand-orange text-lg">📅</span>
                    <span className="text-sm text-text-main">
                      <strong>Scheduled:</strong> {new Date(wo.scheduled_date).toLocaleDateString()} {wo.scheduled_time && `at ${wo.scheduled_time}`}
                    </span>
                  </div>
                )}
                {wo.technician_notes && (
                  <div className="mt-4 bg-brand-orange/10 border border-brand-orange/30 p-4 rounded">
                    <strong className="text-brand-orange uppercase tracking-wider font-heading text-sm block mb-1">Update from Tech:</strong>
                    <p className="text-text-main text-sm">{wo.technician_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 border-b border-border-subtle pb-4">My Quotes</h2>
      <div className="space-y-6">
        {submissions.map((s) => (
          <div key={s.id} className="bg-wood-800 border border-border-subtle rounded-lg p-6 shadow-md">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-border-subtle pb-4 gap-4">
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider self-start ${s.status === 'new' ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/50' : 'bg-wood-700 text-text-sub border border-border-subtle'}`}>
                {s.status}
              </span>
              <div className="text-right">
                <span className="text-text-sub font-bold uppercase text-xs mr-2">Your Offer:</span>
                <span className="text-2xl font-bold text-brand-orange">${(s.offered_price / 100).toFixed(0)}</span>
              </div>
            </div>
            <p className="text-text-main leading-relaxed mb-6 bg-wood-900 p-4 rounded border border-border-subtle">{s.description}</p>
            
            {(s.counter_price || s.admin_notes) && (
              <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded mb-6">
                {s.counter_price && (
                  <p className="text-text-main mb-2"><strong className="text-brand-orange uppercase tracking-wider font-heading text-sm mr-2">Counter-offer:</strong> <span className="text-xl font-bold">${(s.counter_price / 100).toFixed(0)}</span></p>
                )}
                {s.admin_notes && <p className="text-text-main"><strong className="text-brand-orange uppercase tracking-wider font-heading text-sm mr-2">Notes:</strong> {s.admin_notes}</p>}
              </div>
            )}
            
            <p className="text-text-sub text-sm italic">Submitted {new Date(s.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {submissions.length === 0 && <p className="text-text-sub">No quote requests found.</p>}
      </div>
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
    await supabase.from('customer_profiles').update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
    setSaved(true);
    onRefresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 border-b border-border-subtle pb-4">Account Settings</h2>
      <form className="max-w-2xl bg-wood-800 p-8 rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] border border-wood-700/50" onSubmit={saveProfile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">First Name</label>
            <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Last Name</label>
            <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Phone Number</label>
          <input className="w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors shadow-[0_0_15px_rgba(255,95,31,0.3)]">
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
