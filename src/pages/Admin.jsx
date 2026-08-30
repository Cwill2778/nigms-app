import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToPush, registerServiceWorker } from '../lib/pushNotifications';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { WorkOrdersPanel } from './AdminWorkOrders';
import { AssetsPanel } from './AdminAssets';
import './Admin.css';

function Admin() {
  const [session, setSession] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [newLeadCount, setNewLeadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAdminProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAdminProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAdminProfile(user) {
    // Try to load admin profile from admin_profiles table
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setAdminProfile(data);
    } else {
      // Fallback to user metadata
      const meta = user.user_metadata || {};
      setAdminProfile({
        first_name: meta.first_name || meta.full_name?.split(' ')[0] || 'Admin',
        last_name: meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '',
        employee_id: meta.employee_id || user.id.substring(0, 8).toUpperCase(),
        email: user.email,
      });
    }
  }

  // Push notifications & realtime listener for new leads
  useEffect(() => {
    if (!session) return;

    // Auto-enable push notifications
    async function autoEnablePush() {
      await registerServiceWorker();
      if (!('Notification' in window) || !('PushManager' in window)) return;
      if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
        setPushEnabled(true);
      }
    }
    autoEnablePush();

    // Listen for new name_your_price submissions in realtime
    const channel = supabase
      .channel('admin-nyp')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'name_your_price' }, (payload) => {
        setNewLeadCount((c) => c + 1);
        // Show browser notification if supported
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.showNotification('🔨 New Lead!', {
                body: `${payload.new.customer_name} submitted a $${(payload.new.offered_price / 100).toFixed(0)} offer`,
                icon: '/favicon.jpg',
                tag: 'nyp-' + payload.new.id,
                data: { url: '/admin' },
              });
            }
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="admin"><p>Loading...</p></div>;

  if (!session) {
    return (
      <div className="admin-login">
        <div className="admin-login-badge">🔒</div>
        <h1>Admin Portal</h1>
        <p>Nailed It Property Solutions — Authorized Personnel Only</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Business Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="cta-button">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin" style={{ display: 'flex', minHeight: '100vh', padding: 0, maxWidth: '100%', margin: 0 }}>
      {/* SIDEBAR */}
      <div className="admin-sidebar" style={{ width: '250px', background: 'var(--admin-panel)', borderRight: '1px solid var(--admin-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--admin-accent)' }}>COMMAND CENTER</h2>
          <div className="admin-user-info" style={{ marginBottom: '16px' }}>
            <p className="admin-user-name" style={{ fontSize: '0.9rem', margin: '0 0 4px 0', fontWeight: 'bold' }}>{adminProfile?.first_name} {adminProfile?.last_name}</p>
            <div className="admin-user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: 'var(--admin-text-sub)' }}>
              <span>EMP-{adminProfile?.employee_id}</span>
            </div>
          </div>
          <span className="admin-status-badge" style={{ display: 'inline-block', fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', borderRadius: '4px', border: '1px solid #4caf50' }}>🟢 Online</span>
        </div>
        
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {['dashboard', 'inbox', 'crm', 'assets', 'dispatch', 'billing', 'team', 'content', 'settings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 24px',
                background: tab === t ? 'var(--admin-accent-glow)' : 'transparent',
                border: 'none',
                borderLeft: tab === t ? '4px solid var(--admin-accent)' : '4px solid transparent',
                borderRadius: '0',
                color: tab === t ? 'var(--admin-text)' : 'var(--admin-text-sub)',
                boxShadow: 'none',
                fontFamily: 'var(--heading)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                marginBottom: '4px',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ padding: '24px', borderTop: '1px solid var(--admin-border)' }}>
          <button className="btn-sm btn-sm--danger" onClick={handleLogout} style={{ width: '100%' }}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--admin-bg)' }}>
        <div className="admin-panel" style={{ minHeight: 'calc(100vh - 64px)', margin: '0 auto', maxWidth: '1400px' }}>
          {tab === 'dashboard' && <DashboardPanel />}
          {tab === 'inbox' && <InboxPanel adminProfile={adminProfile} />}
          {tab === 'crm' && <CustomersPanel />}
          {tab === 'assets' && <AssetsPanel />}
          {tab === 'dispatch' && <WorkOrdersPanel />}
          {tab === 'billing' && <BillingPanel />}
          {tab === 'team' && <TeamPanel />}
          {tab === 'content' && <ContentPanel />}
          {tab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>

  );
}

// Dashboard — compact analytics + chat side by side
function DashboardPanel() {
  const [stats, setStats] = useState({ total: 0, today: 0, uniqueVisitors: 0, newLeads: 0 });
  const [recentLeads, setRecentLeads] = useState([]);

  useEffect(() => {
    async function fetchQuickStats() {
      const { data: visits } = await supabase.from('page_visits').select('*');
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = (visits || []).filter((v) => v.created_at.startsWith(today));
      const sessionMap = {};
      (visits || []).forEach((v) => { if (v.session_id) sessionMap[v.session_id] = true; });

      const { data: leads } = await supabase.from('name_your_price').select('*').order('created_at', { ascending: false }).limit(5);
      const newLeads = (leads || []).filter((l) => l.status === 'new').length;

      setStats({
        total: (visits || []).length,
        today: todayVisits.length,
        uniqueVisitors: Object.keys(sessionMap).length,
        newLeads,
      });
      setRecentLeads(leads || []);
    }
    fetchQuickStats();
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Left Column — Analytics Summary */}
      <div className="dashboard-left">
        <div className="stats-grid stats-grid--compact">
          <div className="stat-card stat-card--mini">
            <p className="stat-number">{stats.total}</p>
            <p className="stat-label">Page Views</p>
          </div>
          <div className="stat-card stat-card--mini">
            <p className="stat-number">{stats.today}</p>
            <p className="stat-label">Today</p>
          </div>
          <div className="stat-card stat-card--mini">
            <p className="stat-number">{stats.uniqueVisitors}</p>
            <p className="stat-label">Visitors</p>
          </div>
          <div className="stat-card stat-card--mini">
            <p className="stat-number">{stats.newLeads}</p>
            <p className="stat-label">New Leads</p>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Recent Leads</h3>
          {recentLeads.length === 0 ? (
            <p className="empty-state">No leads yet.</p>
          ) : (
            <table className="admin-table admin-table--compact">
              <thead><tr><th>Name</th><th>Price</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentLeads.map((s) => (
                  <tr key={s.id}>
                    <td>{s.customer_name}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>${(s.offered_price / 100).toFixed(0)}</td>
                    <td><span className={`status-badge status-badge--${s.status}`}>{s.status}</span></td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Column — Live Chat */}
      <div className="dashboard-right">
        <h3>💬 Live Chat</h3>
        <ChatPanel />
      </div>
    </div>
  );
}

// Inbox Panel — Unified Communications (Chat + Contacts + Quotes)
function InboxPanel({ adminProfile }) {
  const [inboxTab, setInboxTab] = useState('chat');

  return (
    <>
      <h2>📩 Inbox</h2>
      <div className="admin-subtabs">
        {['chat', 'quotes', 'contact forms'].map((t) => (
          <button key={t} className={`admin-subtab${inboxTab === t ? ' admin-subtab--active' : ''}`} onClick={() => setInboxTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '16px' }}>
        {inboxTab === 'chat' && <ChatPanel adminProfile={adminProfile} />}
        {inboxTab === 'quotes' && <QuotesPanel />}
        {inboxTab === 'contact forms' && <ContactsPanel />}
      </div>
    </>
  );
}

// Billing Panel — Subscription & Invoice Management
function BillingPanel() {
  const [customers, setCustomers] = useState([]);
  const [filterTier, setFilterTier] = useState('all');

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('customers').select('*').neq('subscription_tier', 'none').order('last_name');
      setCustomers(data || []);
    }
    fetch();
  }, []);

  const tierPrices = { essential: 99, proactive: 199, comprehensive: 399 };
  const filtered = filterTier === 'all' ? customers : customers.filter((c) => c.subscription_tier === filterTier);
  const mrr = customers.reduce((sum, c) => sum + (tierPrices[c.subscription_tier] || 0), 0);

  return (
    <>
      <h2>💰 Billing &amp; Subscriptions</h2>
      <div className="stats-grid stats-grid--compact" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-card--mini">
          <p className="stat-number">${mrr.toLocaleString()}</p>
          <p className="stat-label">Monthly Revenue</p>
        </div>
        <div className="stat-card stat-card--mini">
          <p className="stat-number">{customers.length}</p>
          <p className="stat-label">Subscribers</p>
        </div>
        <div className="stat-card stat-card--mini">
          <p className="stat-number">{customers.filter((c) => c.subscription_tier === 'essential').length}</p>
          <p className="stat-label">Essential</p>
        </div>
        <div className="stat-card stat-card--mini">
          <p className="stat-number">{customers.filter((c) => c.subscription_tier === 'proactive').length}</p>
          <p className="stat-label">Proactive</p>
        </div>
      </div>

      <div className="customers-filters" style={{ marginBottom: '16px' }}>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="customers-filter-select">
          <option value="all">All Tiers</option>
          <option value="essential">Essential ($99/mo)</option>
          <option value="proactive">Proactive ($199/mo)</option>
          <option value="comprehensive">Comprehensive ($399/mo)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No active subscribers.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Tier</th><th>Monthly</th><th>Since</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                <td><span className="customer-badge" style={{ background: 'var(--accent)' }}>{c.subscription_tier}</span></td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>${tierPrices[c.subscription_tier]}</td>
                <td>{c.subscription_start ? new Date(c.subscription_start).toLocaleDateString() : '—'}</td>
                <td><span className="customer-badge" style={{ background: c.status === 'active' ? '#4caf50' : '#999' }}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// Team Panel — Internal Operations & Role Management
function TeamPanel() {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('admin_profiles').select('*').order('first_name');
      setAdmins(data || []);
    }
    fetch();
  }, []);

  return (
    <>
      <h2>👥 Team &amp; Operations</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '20px' }}>
        Manage team members and role-based access.
      </p>

      {admins.length === 0 ? (
        <p className="empty-state">No team members found. Make sure admin_profiles table is populated.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Employee ID</th><th>Email</th><th>Role</th><th>Added</th></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.first_name} {a.last_name}</td>
                <td><code style={{ fontSize: '0.75rem', background: 'rgba(255,138,0,0.1)', padding: '2px 6px', borderRadius: '3px' }}>{a.employee_id}</code></td>
                <td>{a.email}</td>
                <td><span className="customer-badge" style={{ background: a.role === 'admin' ? '#2196f3' : '#4caf50' }}>{a.role || 'admin'}</span></td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// Content Panel — Reviews & FAQ nested
function ContentPanel() {
  const [contentTab, setContentTab] = useState('reviews');

  return (
    <>
      <h2>📝 Content Management</h2>
      <div className="admin-subtabs">
        {['reviews', 'faq'].map((t) => (
          <button key={t} className={`admin-subtab${contentTab === t ? ' admin-subtab--active' : ''}`} onClick={() => setContentTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '16px' }}>
        {contentTab === 'reviews' && <ReviewsPanel />}
        {contentTab === 'faq' && <FAQPanel />}
      </div>
    </>
  );
}

// Customers Panel — full CRUD for customers + properties
function CustomersPanel() {
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [view, setView] = useState('list'); // list, detail, add, edit
  const [selected, setSelected] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', secondary_phone: '',
    role: 'homeowner', status: 'lead', subscription_tier: 'none', notes: '',
  });
  const [propertyForm, setPropertyForm] = useState({
    address_line_1: '', address_line_2: '', city: 'Rome', state: 'GA',
    zip_code: '', zone: 'North Rome', gate_code: '', square_footage: '',
    unit_count: '1', year_built: '', notes: '', status: 'active',
  });

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  }

  async function fetchProperties(customerId) {
    const { data } = await supabase.from('properties').select('*').eq('owner_id', customerId).order('created_at', { ascending: false });
    setProperties(data || []);
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      secondary_phone: form.secondary_phone || null,
      role: form.role,
      status: form.status,
      subscription_tier: form.subscription_tier,
      notes: form.notes || null,
    });
    if (!error) {
      fetchCustomers();
      setView('list');
      resetForm();
    }
  }

  async function handleEditCustomer(e) {
    e.preventDefault();
    const { error } = await supabase.from('customers').update({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      secondary_phone: form.secondary_phone || null,
      role: form.role,
      status: form.status,
      subscription_tier: form.subscription_tier,
      notes: form.notes || null,
    }).eq('id', selected.id);
    if (!error) {
      fetchCustomers();
      setView('detail');
      setSelected({ ...selected, ...form });
    }
  }

  async function handleDeleteCustomer(id) {
    if (!confirm('Delete this customer and all their properties? This cannot be undone.')) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchCustomers();
    setView('list');
    setSelected(null);
  }

  async function handleAddProperty(e) {
    e.preventDefault();
    const { error } = await supabase.from('properties').insert({ ...propertyForm, owner_id: selected.id });
    if (!error) {
      fetchProperties(selected.id);
      setShowPropertyForm(false);
      resetPropertyForm();
    }
  }

  async function handleDeleteProperty(propId) {
    if (!confirm('Delete this property?')) return;
    await supabase.from('properties').delete().eq('id', propId);
    fetchProperties(selected.id);
  }

  function resetForm() {
    setForm({ first_name: '', last_name: '', email: '', phone: '', secondary_phone: '', role: 'homeowner', status: 'lead', subscription_tier: 'none', notes: '' });
  }

  function resetPropertyForm() {
    setPropertyForm({ address_line_1: '', address_line_2: '', city: 'Rome', state: 'GA', zip_code: '', zone: 'North Rome', gate_code: '', square_footage: '', unit_count: '1', year_built: '', notes: '', status: 'active' });
  }

  function openDetail(customer) {
    setSelected(customer);
    setView('detail');
    fetchProperties(customer.id);
  }

  function openEdit(customer) {
    setSelected(customer);
    setForm(customer);
    setView('edit');
  }

  const roleColors = { homeowner: 'var(--accent)', landlord: '#4caf50', tenant: '#2196f3' };
  const statusColors = { lead: '#ff9800', active: '#4caf50', inactive: '#9e9e9e', past: '#f44336' };
  const tierLabels = { none: 'None', essential: 'Essential', proactive: 'Proactive', comprehensive: 'Comprehensive' };

  const filtered = customers.filter((c) => {
    if (filterRole !== 'all' && c.role !== filterRole) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (c.first_name + ' ' + c.last_name).toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* MAIN LIST */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="customers-header">
          <h2>Customers ({filtered.length})</h2>
          <button className="cta-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => { resetForm(); setView('add'); setSelected(null); }}>+ Add Customer</button>
        </div>

        <div className="customers-filters">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="customers-search"
          />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="customers-filter-select">
            <option value="all">All Roles</option>
            <option value="homeowner">Homeowners</option>
            <option value="landlord">Landlords</option>
            <option value="tenant">Tenants</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="customers-filter-select">
            <option value="all">All Statuses</option>
            <option value="lead">Leads</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="past">Past</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">No customers found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                {view === 'list' && <th>Role & Status</th>}
                {view === 'list' && <th>Subscription</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ background: selected?.id === c.id ? 'var(--admin-accent-glow)' : 'transparent' }}>
                  <td>
                    <strong>{c.first_name} {c.last_name}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{c.email}</span>
                  </td>
                  {view === 'list' && (
                    <td>
                      <span className="customer-badge" style={{ background: roleColors[c.role] }}>{c.role}</span>
                      <span className="customer-badge" style={{ background: statusColors[c.status] }}>{c.status}</span>
                    </td>
                  )}
                  {view === 'list' && (
                    <td>{tierLabels[c.subscription_tier]}</td>
                  )}
                  <td>
                    <button className="btn-sm" onClick={() => openDetail(c)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL POPUP */}
      {view !== 'list' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          
          {(view === 'add' || view === 'edit') && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>{view === 'add' ? 'Add New Customer' : `Edit: ${form.first_name} ${form.last_name}`}</h2>
                <button className="btn-sm" onClick={() => { setView(view === 'edit' ? 'detail' : 'list'); resetForm(); }}>Close</button>
              </div>
              <form className="admin-form" onSubmit={view === 'add' ? handleAddCustomer : handleEditCustomer} style={{ maxWidth: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>First Name *</label>
                    <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                  </div>
                  <div>
                    <label>Last Name *</label>
                    <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label>Secondary Phone</label>
                    <input type="tel" value={form.secondary_phone} onChange={(e) => setForm({ ...form, secondary_phone: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Role *</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="homeowner">Homeowner</option>
                      <option value="landlord">Landlord</option>
                      <option value="tenant">Tenant</option>
                    </select>
                  </div>
                  <div>
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="lead">Lead</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  <div>
                    <label>Subscription</label>
                    <select value={form.subscription_tier} onChange={(e) => setForm({ ...form, subscription_tier: e.target.value })}>
                      <option value="none">None</option>
                      <option value="essential">Essential ($99/mo)</option>
                      <option value="proactive">Proactive ($199/mo)</option>
                      <option value="comprehensive">Comprehensive ($399/mo)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label>Internal Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Admin-only notes about this customer..." />
                </div>
                <button type="submit" className="cta-button" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.8rem' }}>
                  {view === 'add' ? 'Create Customer' : 'Save Changes'}
                </button>
              </form>
            </>
          )}

          {view === 'detail' && selected && (
            <>
              <div className="customer-detail-header" style={{ marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selected.first_name} {selected.last_name}</h2>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span className="customer-badge" style={{ background: roleColors[selected.role] }}>{selected.role}</span>
                    <span className="customer-badge" style={{ background: statusColors[selected.status] }}>{selected.status}</span>
                    {selected.subscription_tier !== 'none' && (
                      <span className="customer-badge" style={{ background: 'var(--admin-accent)' }}>{tierLabels[selected.subscription_tier]}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-sm" onClick={() => openEdit(selected)}>Edit</button>
                  <button className="btn-sm" onClick={() => { setView('list'); setSelected(null); }}>Close</button>
                </div>
              </div>

              <div className="customer-detail-body">
                <div>
                  <div className="customer-detail-grid" style={{ marginBottom: '24px' }}>
                    <div className="detail-field"><span className="detail-label">Email</span><a href={`mailto:${selected.email}`}>{selected.email}</a></div>
                    <div className="detail-field"><span className="detail-label">Phone</span>{selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : '—'}</div>
                    <div className="detail-field"><span className="detail-label">Secondary</span>{selected.secondary_phone || '—'}</div>
                    <div className="detail-field"><span className="detail-label">Subscription</span>{tierLabels[selected.subscription_tier]}</div>
                    <div className="detail-field"><span className="detail-label">Customer Since</span>{new Date(selected.created_at).toLocaleDateString()}</div>
                  </div>
                  {selected.notes && (
                    <div className="detail-notes">
                      <span className="detail-label">Internal Notes</span>
                      <p>{selected.notes}</p>
                    </div>
                  )}
                </div>

                <div className="customer-properties">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Properties ({properties.length})</h3>
                    {!showPropertyForm && <button className="btn-sm" onClick={() => setShowPropertyForm(true)}>+ Add Property</button>}
                  </div>

                  {showPropertyForm && (
                    <form className="admin-form" onSubmit={handleAddProperty} style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <h4 style={{ marginBottom: '12px' }}>New Property</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label>Address Line 1 *</label>
                          <input type="text" value={propertyForm.address_line_1} onChange={(e) => setPropertyForm({ ...propertyForm, address_line_1: e.target.value })} required />
                        </div>
                        <div>
                          <label>Address Line 2</label>
                          <input type="text" value={propertyForm.address_line_2} onChange={(e) => setPropertyForm({ ...propertyForm, address_line_2: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label>City *</label>
                          <input type="text" value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} required />
                        </div>
                        <div>
                          <label>State *</label>
                          <input type="text" value={propertyForm.state} onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })} required />
                        </div>
                        <div>
                          <label>Zip Code</label>
                          <input type="text" value={propertyForm.zip_code} onChange={(e) => setPropertyForm({ ...propertyForm, zip_code: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label>Zone</label>
                          <select value={propertyForm.zone} onChange={(e) => setPropertyForm({ ...propertyForm, zone: e.target.value })}>
                            <option value="North Rome">North Rome</option>
                            <option value="South Rome">South Rome</option>
                            <option value="West Rome">West Rome</option>
                            <option value="East Rome">East Rome</option>
                            <option value="Surrounding County">Surrounding County</option>
                          </select>
                        </div>
                        <div>
                          <label>Gate Code / Access</label>
                          <input type="text" value={propertyForm.gate_code} onChange={(e) => setPropertyForm({ ...propertyForm, gate_code: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button type="submit" className="cta-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Save Property</button>
                        <button type="button" className="btn-sm" onClick={() => { setShowPropertyForm(false); resetPropertyForm(); }}>Cancel</button>
                      </div>
                    </form>
                  )}

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {properties.map((p) => (
                      <div key={p.id} style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>🏠 {p.address_line_1}</p>
                          <button className="btn-sm btn-sm--danger" onClick={() => handleDeleteProperty(p.id)} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>Delete</button>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-sub)' }}>{p.city}, {p.state} {p.zip_code}</p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '3px' }}>Zone: {p.zone}</span>
                          {p.gate_code && <span style={{ background: 'rgba(255,138,0,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '3px' }}>Gate: {p.gate_code}</span>}
                        </div>
                      </div>
                    ))}
                    {properties.length === 0 && !showPropertyForm && <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No properties added.</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          </div>
        </div>
      )}
    </div>
  );
}


function AnalyticsPanel() {
  const [stats, setStats] = useState({ total: 0, today: 0, pages: [] });
  const [scrollStats, setScrollStats] = useState([]);
  const [clickStats, setClickStats] = useState({ topElements: [], byPage: [] });
  const [exitStats, setExitStats] = useState({ byPage: [], byType: [] });
  const [formAbandons, setFormAbandons] = useState([]);
  const [dwellStats, setDwellStats] = useState([]);
  const [attributionStats, setAttributionStats] = useState({ byChannel: [], bySource: [], byCampaign: [], byLanding: [] });
  const [visitorStats, setVisitorStats] = useState({ devices: [], browsers: [], oses: [], sessions: [], uniqueVisitors: 0 });

  useEffect(() => {
    async function fetchStats() {
      const { data: all } = await supabase.from('page_visits').select('*');
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = (all || []).filter((v) => v.created_at.startsWith(today));

      const pageCounts = {};
      (all || []).forEach((v) => {
        pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
      });

      const pages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([page, count]) => ({ page, count }));

      setStats({ total: (all || []).length, today: todayVisits.length, pages });

      // Visitor/device stats
      const deviceMap = {};
      const browserMap = {};
      const osMap = {};
      const sessionMap = {};

      (all || []).forEach((v) => {
        if (v.device_type) deviceMap[v.device_type] = (deviceMap[v.device_type] || 0) + 1;
        if (v.browser) browserMap[v.browser] = (browserMap[v.browser] || 0) + 1;
        if (v.os) osMap[v.os] = (osMap[v.os] || 0) + 1;
        if (v.session_id) {
          if (!sessionMap[v.session_id]) {
            sessionMap[v.session_id] = { pages: [], device: v.device_type, browser: v.browser, os: v.os, firstSeen: v.created_at };
          }
          sessionMap[v.session_id].pages.push(v.page);
        }
      });

      const toSorted = (map) => Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      const sessions = Object.entries(sessionMap)
        .map(([id, info]) => ({ id: id.substring(0, 8), ...info, pageCount: info.pages.length }))
        .sort((a, b) => new Date(b.firstSeen) - new Date(a.firstSeen))
        .slice(0, 30);

      setVisitorStats({
        devices: toSorted(deviceMap),
        browsers: toSorted(browserMap),
        oses: toSorted(osMap),
        sessions,
        uniqueVisitors: Object.keys(sessionMap).length,
      });
    }

    async function fetchScrollDepth() {
      const { data } = await supabase.from('scroll_depth').select('*');
      if (!data || data.length === 0) { setScrollStats([]); return; }

      // Aggregate by page
      const pageMap = {};
      data.forEach((row) => {
        if (!pageMap[row.page]) {
          pageMap[row.page] = { depths: [], milestones: { 25: 0, 50: 0, 75: 0, 100: 0 }, count: 0 };
        }
        pageMap[row.page].depths.push(row.max_depth);
        pageMap[row.page].count += 1;
        (row.milestones_hit || []).forEach((m) => {
          if (pageMap[row.page].milestones[m] !== undefined) {
            pageMap[row.page].milestones[m] += 1;
          }
        });
      });

      const aggregated = Object.entries(pageMap)
        .map(([page, info]) => ({
          page,
          avgDepth: Math.round(info.depths.reduce((a, b) => a + b, 0) / info.depths.length),
          sessions: info.count,
          milestones: info.milestones,
        }))
        .sort((a, b) => b.sessions - a.sessions);

      setScrollStats(aggregated);
    }

    fetchStats();
    fetchScrollDepth();

    async function fetchClickStats() {
      const { data } = await supabase.from('click_events').select('*');
      if (!data || data.length === 0) { setClickStats({ topElements: [], byPage: [] }); return; }

      // Top clicked elements (group by text + href)
      const elementMap = {};
      const pageClickMap = {};
      data.forEach((row) => {
        const key = `${row.element_text || ''}|${row.element_href || ''}|${row.element_tag}`;
        if (!elementMap[key]) {
          elementMap[key] = { text: row.element_text, href: row.element_href, tag: row.element_tag, count: 0 };
        }
        elementMap[key].count += 1;

        pageClickMap[row.page] = (pageClickMap[row.page] || 0) + 1;
      });

      const topElements = Object.values(elementMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const byPage = Object.entries(pageClickMap)
        .sort((a, b) => b[1] - a[1])
        .map(([page, count]) => ({ page, count }));

      setClickStats({ topElements, byPage });
    }

    fetchClickStats();

    async function fetchExitStats() {
      const { data } = await supabase.from('exit_events').select('*');
      if (!data || data.length === 0) { setExitStats({ byPage: [], byType: [] }); return; }

      // Aggregate by page
      const pageMap = {};
      const typeMap = {};
      data.forEach((row) => {
        if (!pageMap[row.page]) {
          pageMap[row.page] = { times: [], count: 0, leaveSite: 0 };
        }
        pageMap[row.page].times.push(row.time_on_page);
        pageMap[row.page].count += 1;
        if (row.exit_type === 'leave_site' || row.exit_type === 'tab_hidden') {
          pageMap[row.page].leaveSite += 1;
        }

        typeMap[row.exit_type] = (typeMap[row.exit_type] || 0) + 1;
      });

      const byPage = Object.entries(pageMap)
        .map(([page, info]) => ({
          page,
          avgTime: Math.round(info.times.reduce((a, b) => a + b, 0) / info.times.length),
          exits: info.count,
          bounceRate: Math.round((info.leaveSite / info.count) * 100),
        }))
        .sort((a, b) => b.exits - a.exits);

      const byType = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      setExitStats({ byPage, byType });
    }

    fetchExitStats();

    async function fetchFormAbandons() {
      const { data } = await supabase.from('form_abandonment').select('*').order('created_at', { ascending: false });
      if (!data || data.length === 0) { setFormAbandons([]); return; }

      // Aggregate by page + last_field
      const fieldMap = {};
      data.forEach((row) => {
        const key = `${row.page}|${row.last_field || 'unknown'}`;
        if (!fieldMap[key]) {
          fieldMap[key] = { page: row.page, lastField: row.last_field || 'unknown', count: 0, avgFilled: [] };
        }
        fieldMap[key].count += 1;
        if (row.total_fields > 0) {
          fieldMap[key].avgFilled.push(Math.round((row.fields_filled / row.total_fields) * 100));
        }
      });

      const aggregated = Object.values(fieldMap)
        .map((info) => ({
          ...info,
          avgProgress: info.avgFilled.length > 0
            ? Math.round(info.avgFilled.reduce((a, b) => a + b, 0) / info.avgFilled.length)
            : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setFormAbandons(aggregated);
    }

    fetchFormAbandons();

    async function fetchDwellTime() {
      const { data } = await supabase.from('dwell_time').select('*');
      if (!data || data.length === 0) { setDwellStats([]); return; }

      const pageMap = {};
      data.forEach((row) => {
        if (!pageMap[row.page]) {
          pageMap[row.page] = { times: [], count: 0 };
        }
        pageMap[row.page].times.push(row.active_seconds);
        pageMap[row.page].count += 1;
      });

      const aggregated = Object.entries(pageMap)
        .map(([page, info]) => {
          const sorted = [...info.times].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const avg = Math.round(info.times.reduce((a, b) => a + b, 0) / info.times.length);
          const max = Math.max(...info.times);
          return { page, avg, median, max, sessions: info.count };
        })
        .sort((a, b) => b.sessions - a.sessions);

      setDwellStats(aggregated);
    }

    fetchDwellTime();

    async function fetchAttribution() {
      const { data } = await supabase.from('lead_attribution').select('*');
      if (!data || data.length === 0) {
        setAttributionStats({ byChannel: [], bySource: [], byCampaign: [], byLanding: [] });
        return;
      }

      const channelMap = {};
      const sourceMap = {};
      const campaignMap = {};
      const landingMap = {};

      data.forEach((row) => {
        channelMap[row.channel] = (channelMap[row.channel] || 0) + 1;
        if (row.utm_source) sourceMap[row.utm_source] = (sourceMap[row.utm_source] || 0) + 1;
        if (row.utm_campaign) campaignMap[row.utm_campaign] = (campaignMap[row.utm_campaign] || 0) + 1;
        landingMap[row.landing_page] = (landingMap[row.landing_page] || 0) + 1;
      });

      const toSorted = (map) => Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      setAttributionStats({
        byChannel: toSorted(channelMap),
        bySource: toSorted(sourceMap),
        byCampaign: toSorted(campaignMap),
        byLanding: toSorted(landingMap),
      });
    }

    fetchAttribution();
  }, []);

  const COLORS = ['#ff8a00', '#ff6b00', '#e65100', '#ff9e40', '#ffb74d', '#ffe0b2', '#4caf50', '#2196f3'];
  const chartMargin = { top: 10, right: 20, left: 0, bottom: 5 };
  const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.8rem' };
  const tickStyle = { fontSize: 11, fill: 'var(--text-sub)' };

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-number">{stats.total}</p>
          <p className="stat-label">Total Page Views</p>
        </div>
        <div className="stat-card">
          <p className="stat-number">{stats.today}</p>
          <p className="stat-label">Today</p>
        </div>
        <div className="stat-card">
          <p className="stat-number">{visitorStats.uniqueVisitors}</p>
          <p className="stat-label">Unique Visitors</p>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Visitors &amp; Devices</h2>
      {visitorStats.devices.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No device data yet (data populates after migration is applied).</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ height: 200 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Device Type</h3>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={visitorStats.devices.map((d) => ({ name: d.name, value: d.count }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={{ fontSize: 10 }}>
                    {visitorStats.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 200 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Browser</h3>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={visitorStats.browsers.map((b) => ({ name: b.name, value: b.count }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={{ fontSize: 10 }}>
                    {visitorStats.browsers.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 200 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Operating System</h3>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={visitorStats.oses.map((o) => ({ name: o.name, value: o.count }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={{ fontSize: 10 }}>
                    {visitorStats.oses.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Recent Visitor Sessions</h3>
          <table className="admin-table">
            <thead><tr><th>Session</th><th>Device</th><th>Browser</th><th>OS</th><th>Pages</th><th>Journey</th></tr></thead>
            <tbody>
              {visitorStats.sessions.map((s) => (
                <tr key={s.id}>
                  <td><code style={{ fontSize: '0.7rem' }}>{s.id}</code></td>
                  <td>{s.device || '—'}</td>
                  <td>{s.browser || '—'}</td>
                  <td>{s.os || '—'}</td>
                  <td>{s.pageCount}</td>
                  <td style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.pages.join(' → ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Pages by Views</h2>
      {stats.pages.length > 0 && (
        <div style={{ width: '100%', height: 250, marginBottom: '1rem' }}>
          <ResponsiveContainer>
            <BarChart data={stats.pages} margin={chartMargin}>
              <XAxis dataKey="page" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ff8a00" radius={[3, 3, 0, 0]} name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <table className="admin-table">
        <thead><tr><th>Page</th><th>Views</th></tr></thead>
        <tbody>
          {stats.pages.map((p) => (
            <tr key={p.page}><td>{p.page}</td><td>{p.count}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>Scroll Depth by Page</h2>
      {scrollStats.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No scroll depth data yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height: 250, marginBottom: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={scrollStats} margin={chartMargin}>
                <XAxis dataKey="page" tick={tickStyle} />
                <YAxis domain={[0, 100]} tick={tickStyle} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgDepth" fill="#4caf50" radius={[3, 3, 0, 0]} name="Avg Depth %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Page</th><th>Avg Depth</th><th>Sessions</th><th>25%</th><th>50%</th><th>75%</th><th>100%</th></tr>
            </thead>
            <tbody>
              {scrollStats.map((s) => (
                <tr key={s.page}>
                  <td>{s.page}</td>
                  <td>{s.avgDepth}%</td>
                  <td>{s.sessions}</td>
                  <td>{s.milestones[25]}</td>
                  <td>{s.milestones[50]}</td>
                  <td>{s.milestones[75]}</td>
                  <td>{s.milestones[100]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Click Tracking</h2>
      {clickStats.topElements.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No click data yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height: 220, marginBottom: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={clickStats.byPage} margin={chartMargin}>
                <XAxis dataKey="page" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#2196f3" radius={[3, 3, 0, 0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Most Clicked Elements</h3>
          <table className="admin-table">
            <thead><tr><th>Element</th><th>Text</th><th>Link</th><th>Clicks</th></tr></thead>
            <tbody>
              {clickStats.topElements.map((el, i) => (
                <tr key={i}>
                  <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '2px' }}>{el.tag}</code></td>
                  <td>{el.text ? el.text.substring(0, 40) : '—'}</td>
                  <td style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.href || '—'}</td>
                  <td>{el.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Exit Tracking</h2>
      {exitStats.byPage.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No exit data yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ height: 220 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Exit Types</h3>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={exitStats.byType.map((t) => ({ name: t.type === 'leave_site' ? 'Left Site' : t.type === 'tab_hidden' ? 'Tab Hidden' : 'Navigated', value: t.count }))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={{ fontSize: 11 }}>
                    {exitStats.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 220 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Bounce Rate by Page</h3>
              <ResponsiveContainer>
                <BarChart data={exitStats.byPage} margin={chartMargin}>
                  <XAxis dataKey="page" tick={{ fontSize: 10, fill: 'var(--text-sub)' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="bounceRate" fill="#f44336" radius={[3, 3, 0, 0]} name="Bounce %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <table className="admin-table">
            <thead><tr><th>Page</th><th>Avg Time (s)</th><th>Total Exits</th><th>Bounce Rate</th></tr></thead>
            <tbody>
              {exitStats.byPage.map((p) => (
                <tr key={p.page}>
                  <td>{p.page}</td>
                  <td>{p.avgTime}s</td>
                  <td>{p.exits}</td>
                  <td>{p.bounceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Form Abandonment</h2>
      {formAbandons.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No form abandonment data yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height: 220, marginBottom: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={formAbandons.slice(0, 10)} margin={chartMargin}>
                <XAxis dataKey="lastField" tick={{ fontSize: 10, fill: 'var(--text-sub)' }} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#e65100" radius={[3, 3, 0, 0]} name="Abandonments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="admin-table">
            <thead><tr><th>Page</th><th>Last Field</th><th>Abandonments</th><th>Avg Progress</th></tr></thead>
            <tbody>
              {formAbandons.map((f, i) => (
                <tr key={i}>
                  <td>{f.page}</td>
                  <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '2px' }}>{f.lastField}</code></td>
                  <td>{f.count}</td>
                  <td>{f.avgProgress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Dwell Time (Active Engagement)</h2>
      {dwellStats.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No dwell time data yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height: 250, marginBottom: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={dwellStats} margin={chartMargin}>
                <XAxis dataKey="page" tick={tickStyle} />
                <YAxis tick={tickStyle} unit="s" />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => formatTime(val)} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="avg" fill="#ff8a00" radius={[3, 3, 0, 0]} name="Average" />
                <Bar dataKey="median" fill="#4caf50" radius={[3, 3, 0, 0]} name="Median" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="admin-table">
            <thead><tr><th>Page</th><th>Avg</th><th>Median</th><th>Max</th><th>Sessions</th></tr></thead>
            <tbody>
              {dwellStats.map((d) => (
                <tr key={d.page}>
                  <td>{d.page}</td>
                  <td>{formatTime(d.avg)}</td>
                  <td>{formatTime(d.median)}</td>
                  <td>{formatTime(d.max)}</td>
                  <td>{d.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Lead Attribution</h2>
      {attributionStats.byChannel.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No attribution data yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ height: 250 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Traffic Channels</h3>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={attributionStats.byChannel.map((c) => ({ name: c.name, value: c.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={{ fontSize: 11 }}>
                    {attributionStats.byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 250 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>Landing Pages</h3>
              <ResponsiveContainer>
                <BarChart data={attributionStats.byLanding} margin={chartMargin}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-sub)' }} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#ff9e40" radius={[3, 3, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>By Source</h3>
              {attributionStats.bySource.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>No UTM sources tracked yet.</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Source</th><th>Sessions</th></tr></thead>
                  <tbody>
                    {attributionStats.bySource.map((s) => (
                      <tr key={s.name}><td>{s.name}</td><td>{s.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>By Campaign</h3>
              {attributionStats.byCampaign.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>No campaigns tracked yet.</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Campaign</th><th>Sessions</th></tr></thead>
                  <tbody>
                    {attributionStats.byCampaign.map((c) => (
                      <tr key={c.name}><td>{c.name}</td><td>{c.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// Reviews Panel
function ReviewsPanel() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ name: '', stars: 5, text: '', date: '' });

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    setReviews(data || []);
  }

  async function togglePublish(id, published) {
    await supabase.from('reviews').update({ published: !published }).eq('id', id);
    fetchReviews();
  }

  async function deleteReview(id) {
    if (confirm('Delete this review?')) {
      await supabase.from('reviews').delete().eq('id', id);
      fetchReviews();
    }
  }

  async function addReview(e) {
    e.preventDefault();
    await supabase.from('reviews').insert({ ...newReview, published: false });
    setNewReview({ name: '', stars: 5, text: '', date: '' });
    fetchReviews();
  }

  return (
    <>
      <h2>Add Review</h2>
      <form className="admin-form" onSubmit={addReview}>
        <input placeholder="Name" value={newReview.name} onChange={(e) => setNewReview({ ...newReview, name: e.target.value })} required />
        <select value={newReview.stars} onChange={(e) => setNewReview({ ...newReview, stars: parseInt(e.target.value) })}>
          <option value={5}>5 Stars</option><option value={4}>4 Stars</option><option value={3}>3 Stars</option>
        </select>
        <textarea placeholder="Review text" value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} required />
        <input placeholder="Date (e.g. June 2026)" value={newReview.date} onChange={(e) => setNewReview({ ...newReview, date: e.target.value })} />
        <button type="submit" className="cta-button">Add Review</button>
      </form>

      <h2>All Reviews ({reviews.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Stars</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{'★'.repeat(r.stars)}</td>
              <td>{r.published ? '✅ Published' : '⏸ Draft'}</td>
              <td>
                <button className="btn-sm" onClick={() => togglePublish(r.id, r.published)}>
                  {r.published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn-sm btn-sm--danger" onClick={() => deleteReview(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// FAQ Panel
function FAQPanel() {
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  useEffect(() => { fetchFaqs(); }, []);

  async function fetchFaqs() {
    const { data } = await supabase.from('faqs').select('*').order('sort_order');
    setFaqs(data || []);
  }

  async function togglePublish(id, published) {
    await supabase.from('faqs').update({ published: !published }).eq('id', id);
    fetchFaqs();
  }

  async function deleteFaq(id) {
    if (confirm('Delete this FAQ?')) {
      await supabase.from('faqs').delete().eq('id', id);
      fetchFaqs();
    }
  }

  async function addFaq(e) {
    e.preventDefault();
    await supabase.from('faqs').insert({ ...newFaq, sort_order: faqs.length + 1, published: true });
    setNewFaq({ question: '', answer: '' });
    fetchFaqs();
  }

  return (
    <>
      <h2>Add FAQ</h2>
      <form className="admin-form" onSubmit={addFaq}>
        <input placeholder="Question" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} required />
        <textarea placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} required />
        <button type="submit" className="cta-button">Add FAQ</button>
      </form>

      <h2>All FAQs ({faqs.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Question</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {faqs.map((f) => (
            <tr key={f.id}>
              <td>{f.question.substring(0, 60)}...</td>
              <td>{f.published ? '✅' : '⏸'}</td>
              <td>
                <button className="btn-sm" onClick={() => togglePublish(f.id, f.published)}>
                  {f.published ? 'Hide' : 'Show'}
                </button>
                <button className="btn-sm btn-sm--danger" onClick={() => deleteFaq(f.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// Contacts Panel
function ContactsPanel() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).then(({ data }) => setContacts(data || []));
  }, []);

  return (
    <>
      <h2>Contact Submissions ({contacts.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Interest</th><th>Date</th></tr></thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.interest}</td>
              <td>{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// Careers Panel
function CareersPanel() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    supabase.from('career_applications').select('*').order('created_at', { ascending: false }).then(({ data }) => setApps(data || []));
  }, []);

  async function updateStatus(id, status) {
    await supabase.from('career_applications').update({ status }).eq('id', id);
    const { data } = await supabase.from('career_applications').select('*').order('created_at', { ascending: false });
    setApps(data || []);
  }

  return (
    <>
      <h2>Applications ({apps.length})</h2>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Position</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td>{a.data?.firstName} {a.data?.lastName}</td>
              <td>{a.data?.position}</td>
              <td>{a.status}</td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
              <td>
                <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} style={{ fontSize: '0.75rem', padding: '4px' }}>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="contacted">Contacted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// Settings Panel
function SettingsPanel() {
  const [promo, setPromo] = useState({ enabled: false, text: '' });

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('key', 'promo_banner').single().then(({ data }) => {
      if (data) setPromo(data.value);
    });
  }, []);

  async function savePromo() {
    await supabase.from('site_settings').upsert({ key: 'promo_banner', value: promo, updated_at: new Date().toISOString() });
    alert('Promo settings saved!');
  }

  return (
    <>
      <h2>Promo Banner</h2>
      <div className="admin-form">
        <label>
          <input type="checkbox" checked={promo.enabled} onChange={(e) => setPromo({ ...promo, enabled: e.target.checked })} />
          {' '}Banner Enabled
        </label>
        <label>Banner Text</label>
        <textarea value={promo.text} onChange={(e) => setPromo({ ...promo, text: e.target.value })} />
        <button className="cta-button" onClick={savePromo}>Save Settings</button>
      </div>
    </>
  );
}

// Chat Panel
function ChatPanel({ adminProfile }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  
  // Customer Lookup State
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (activeConvo && payload.new.conversation_id === activeConvo) {
          setMessages((prev) => [...prev, payload.new]);
        }
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo]);

  async function fetchConversations() {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    setConversations(data || []);
  }

  async function openConvo(id) {
    setActiveConvo(id);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at');
    setMessages(data || []);
    
    // Auto-fill lookup email if visitor provided it
    const convo = conversations.find(c => c.id === id);
    if (convo && convo.visitor_email) {
      setLookupEmail(convo.visitor_email);
      handleLookup(convo.visitor_email);
    } else {
      setLookupEmail('');
      setLookupResult(null);
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !activeConvo) return;

    const agentName = adminProfile?.first_name || 'Support';
    const messageContent = `[Agent ${agentName}]: ${reply.trim()}`;

    await supabase.from('chat_messages').insert({
      conversation_id: activeConvo,
      sender: 'admin',
      message: messageContent,
    });

    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConvo);

    setReply('');
  }

  async function closeConvo(id) {
    await supabase.from('chat_conversations').update({ status: 'closed' }).eq('id', id);
    fetchConversations();
    if (activeConvo === id) { setActiveConvo(null); setMessages([]); }
  }

  async function handleLookup(emailOverride) {
    const emailToSearch = typeof emailOverride === 'string' ? emailOverride : lookupEmail;
    if (!emailToSearch.trim()) return;
    setLookupLoading(true);
    const { data } = await supabase.from('customers').select('*').ilike('email', `%${emailToSearch.trim()}%`).limit(1);
    if (data && data.length > 0) {
      setLookupResult(data[0]);
    } else {
      setLookupResult({ notFound: true });
    }
    setLookupLoading(false);
  }

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
      <div style={{ width: '250px', borderRight: '1px solid var(--admin-border)', paddingRight: '16px' }}>
        <h3 style={{ marginBottom: '12px' }}>Conversations</h3>
        {conversations.length === 0 && <p style={{ fontSize: '0.8rem' }}>No conversations yet.</p>}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => openConvo(c.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              marginBottom: '6px',
              background: activeConvo === c.id ? 'var(--admin-accent-glow)' : 'var(--admin-panel)',
              border: `1px solid ${activeConvo === c.id ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              color: 'var(--admin-text)',
              fontSize: '0.8rem',
            }}
          >
            <strong>{c.visitor_name || 'Visitor'}</strong>
            <br />
            <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-sub)' }}>
              {c.status === 'closed' ? '🔒 Closed' : '🟢 Active'}
            </span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
        {!activeConvo ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>Select a conversation to view messages.</p>
        ) : (
          <>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3>Messages</h3>
                <button className="btn-sm btn-sm--danger" onClick={() => closeConvo(activeConvo)}>Close Chat</button>
              </div>
              <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto', marginBottom: '12px', padding: '8px', background: 'var(--admin-panel)', borderRadius: '2px', border: '1px solid var(--admin-border)' }}>
                {messages.map((m) => {
                  let displayMsg = m.message;
                  let agentLabel = null;
                  if (m.sender === 'admin') {
                    const match = displayMsg.match(/^\[Agent (.*?)\]: (.*)$/);
                    if (match) {
                      agentLabel = match[1];
                      displayMsg = match[2];
                    }
                  }
                  
                  return (
                    <div key={m.id} style={{ marginBottom: '8px', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                        {agentLabel && <span style={{ fontSize: '0.65rem', color: 'var(--admin-accent)', fontWeight: 'bold', marginBottom: '2px' }}>{agentLabel}</span>}
                        <span style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: m.sender === 'admin' ? 'var(--admin-accent)' : 'var(--admin-bg)',
                          color: m.sender === 'admin' ? '#1A1A1D' : 'var(--admin-text)',
                          border: m.sender === 'visitor' ? '1px solid var(--admin-border)' : 'none',
                        }}>
                          {displayMsg}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendReply} style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply..."
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--admin-border)', borderRadius: '2px', background: 'var(--admin-panel)', color: 'var(--admin-text)', fontSize: '0.85rem' }}
                />
                <button type="submit" className="cta-button" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Send</button>
              </form>
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid var(--admin-border)', paddingLeft: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Customer Lookup</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="Email..."
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--admin-border)', borderRadius: '2px', background: 'var(--admin-panel)', color: 'var(--admin-text)', fontSize: '0.8rem' }}
                />
                <button type="submit" className="cta-button" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>Search</button>
              </form>

              {lookupLoading && <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>Searching...</p>}
              {lookupResult && !lookupLoading && (
                lookupResult.notFound ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--admin-accent)' }}>No customer found.</p>
                ) : (
                  <div style={{ background: 'var(--admin-panel)', padding: '12px', borderRadius: '4px', border: '1px solid var(--admin-border)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--admin-text)' }}>
                      {lookupResult.first_name} {lookupResult.last_name}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>
                      {lookupResult.email}
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>
                      {lookupResult.phone}
                    </p>
                    <div style={{ display: 'inline-block', padding: '2px 6px', background: 'var(--admin-accent-glow)', border: '1px solid var(--admin-accent)', borderRadius: '2px', fontSize: '0.7rem', color: 'var(--admin-accent)', textTransform: 'uppercase' }}>
                      {lookupResult.subscription_tier || 'No Plan'}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuotesPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [counterPrice, setCounterPrice] = useState('');

  useEffect(() => { fetchSubmissions(); }, []);

  async function fetchSubmissions() {
    const { data } = await supabase
      .from('name_your_price')
      .select('*')
      .order('created_at', { ascending: false });
    setSubmissions(data || []);
  }

  async function updateStatus(id, status) {
    const updates = { status, updated_at: new Date().toISOString() };
    if (status === 'countered' && counterPrice) {
      updates.counter_price = parseInt(counterPrice) * 100;
    }
    if (adminNotes.trim()) {
      updates.admin_notes = adminNotes.trim();
    }
    await supabase.from('name_your_price').update(updates).eq('id', id);
    fetchSubmissions();
    setSelected(null);
    setAdminNotes('');
    setCounterPrice('');
  }

  async function markViewed(id) {
    await supabase.from('name_your_price').update({ status: 'viewed', updated_at: new Date().toISOString() }).eq('id', id);
    fetchSubmissions();
  }

  function getPublicUrl(path) {
    const { data } = supabase.storage.from('nyp-attachments').getPublicUrl(path);
    return data?.publicUrl || '';
  }

  const statusColors = { new: '#ff8a00', viewed: '#2196f3', accepted: '#4caf50', countered: '#ff9800', declined: '#f44336' };

  if (selected) {
    const s = submissions.find((sub) => sub.id === selected);
    if (!s) return null;

    return (
      <>
        <button className="btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: '16px' }}>&larr; Back to List</button>
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '24px', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>{s.customer_name}</h2>
            <span style={{ background: statusColors[s.status] || 'var(--border)', color: '#fff', padding: '4px 10px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>{s.status.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
            <p><strong>Phone:</strong> {s.customer_phone || '—'}</p>
            <p><strong>Email:</strong> {s.customer_email || '—'}</p>
            <p><strong>Offered Price:</strong> <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>${(s.offered_price / 100).toFixed(0)}</span></p>
            <p><strong>Materials:</strong> {s.materials_supplied_by === 'customer' ? 'Customer supplies' : s.materials_supplied_by === 'nailedit' ? 'Nailed It supplies' : 'Not sure yet'}</p>
            <p><strong>Submitted:</strong> {new Date(s.created_at).toLocaleString()}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Description</h3>
            <p style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '4px', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{s.description}</p>
          </div>

          {s.attachments && s.attachments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Attachments ({s.attachments.length})</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {s.attachments.map((path, i) => {
                  const url = getPublicUrl(path);
                  const isVideo = /\.(mp4|mov|webm)$/i.test(path);
                  return isVideo ? (
                    <video key={i} src={url} controls style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Attachment ${i + 1}`} style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', border: '1px solid var(--border)', objectFit: 'cover' }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                placeholder="Admin notes (optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Counter offer: $</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  style={{ width: '100px', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="cta-button" style={{ padding: '10px 16px', fontSize: '0.8rem' }} onClick={() => updateStatus(s.id, 'accepted')}>Accept Price</button>
                <button className="cta-button" style={{ padding: '10px 16px', fontSize: '0.8rem', background: '#ff9800' }} onClick={() => updateStatus(s.id, 'countered')}>Send Counter</button>
                <button className="btn-sm btn-sm--danger" onClick={() => updateStatus(s.id, 'declined')}>Decline</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const newCount = submissions.filter((s) => s.status === 'new').length;

  return (
    <>
      <h2>Name Your Price Submissions {newCount > 0 && <span style={{ background: 'var(--accent)', color: '#1a1a1d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', marginLeft: '8px' }}>{newCount} new</span>}</h2>
      {submissions.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>No submissions yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.customer_name}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>${(s.offered_price / 100).toFixed(0)}</td>
                <td><span style={{ background: statusColors[s.status] || 'var(--border)', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem' }}>{s.status}</span></td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-sm" onClick={() => { setSelected(s.id); if (s.status === 'new') markViewed(s.id); }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default Admin;
