import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';
import './Dashboard.css';

function Dashboard() {
  usePageMeta('My Account | Nailed It Property Solutions', 'Manage your properties, subscriptions, and service requests.');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
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
    const [profileRes, propsRes, subsRes, nypsRes] = await Promise.all([
      supabase.from('customer_profiles').select('*').eq('id', userId).single(),
      supabase.from('customer_properties').select('*').eq('customer_id', userId),
      supabase.from('customer_subscriptions').select('*, subscription_tiers(*)').eq('customer_id', userId),
      supabase.from('name_your_price').select('*').eq('customer_email', session?.user?.email).order('created_at', { ascending: false }),
    ]);
    setProfile(profileRes.data);
    setProperties(propsRes.data || []);
    setSubscriptions(subsRes.data || []);
    setSubmissions(nypsRes.data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) return <div className="dashboard"><p className="dashboard-loading">Loading...</p></div>;

  if (!session) {
    return (
      <div className="dashboard">
        <div className="dashboard-auth">
          <h1>My Account</h1>
          <p>Sign in to manage your properties, subscriptions, and service requests.</p>
          <Link to="/login" className="cta-button">Sign In</Link>
          <p className="dashboard-signup-hint">Don&rsquo;t have an account? <Link to="/signup">Create one</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}</h1>
          <p className="dashboard-email">{session.user.email}</p>
        </div>
        <button className="btn-sm" onClick={handleLogout}>Sign Out</button>
      </div>

      <div className="dashboard-tabs">
        {['overview', 'properties', 'requests', 'settings'].map((t) => (
          <button
            key={t}
            className={`dashboard-tab${tab === t ? ' dashboard-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {tab === 'overview' && <OverviewTab profile={profile} properties={properties} subscriptions={subscriptions} submissions={submissions} />}
        {tab === 'properties' && <PropertiesTab properties={properties} userId={session.user.id} onRefresh={() => loadData(session.user.id)} />}
        {tab === 'requests' && <RequestsTab submissions={submissions} />}
        {tab === 'settings' && <SettingsTab profile={profile} userId={session.user.id} onRefresh={() => loadData(session.user.id)} />}
      </div>
    </div>
  );
}

function OverviewTab({ profile, properties, subscriptions, submissions }) {
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const pendingRequests = submissions.filter((s) => s.status === 'new' || s.status === 'viewed');

  return (
    <div className="dashboard-overview">
      <div className="overview-grid">
        <div className="overview-card">
          <p className="overview-number">{properties.length}</p>
          <p className="overview-label">Properties</p>
        </div>
        <div className="overview-card">
          <p className="overview-number">{activeSubscriptions.length}</p>
          <p className="overview-label">Active Plans</p>
        </div>
        <div className="overview-card">
          <p className="overview-number">{pendingRequests.length}</p>
          <p className="overview-label">Pending Requests</p>
        </div>
      </div>

      {activeSubscriptions.length > 0 && (
        <div className="overview-section">
          <h3>Your Subscriptions</h3>
          {activeSubscriptions.map((sub) => (
            <div key={sub.id} className="subscription-card">
              <div className="subscription-tier">{sub.subscription_tiers?.name || sub.tier_id}</div>
              <p className="subscription-price">${((sub.subscription_tiers?.price_cents || 0) / 100).toFixed(0)}/mo</p>
              <p className="subscription-status">{sub.status}</p>
            </div>
          ))}
        </div>
      )}

      {submissions.length > 0 && (
        <div className="overview-section">
          <h3>Recent Requests</h3>
          {submissions.slice(0, 3).map((s) => (
            <div key={s.id} className="request-card">
              <div className="request-card-header">
                <span className={`request-status request-status--${s.status}`}>{s.status}</span>
                <span className="request-price">${(s.offered_price / 100).toFixed(0)}</span>
              </div>
              <p className="request-desc">{s.description.substring(0, 80)}{s.description.length > 80 ? '...' : ''}</p>
              <p className="request-date">{new Date(s.created_at).toLocaleDateString()}</p>
            </div>
          ))}
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
      <div className="section-header">
        <h2>My Properties</h2>
        <button className="cta-button cta-button--secondary" onClick={() => setAdding(!adding)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          {adding ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {adding && (
        <form className="property-form" onSubmit={addProperty}>
          <input placeholder="Label (e.g. Primary, Rental #1)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          <input placeholder="Street address *" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required />
          <div className="property-form-row">
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ width: '60px' }} />
            <input placeholder="ZIP *" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
          </div>
          <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
            <option value="">Select area (optional)</option>
            <option value="West Rome">West Rome</option>
            <option value="North Rome">North Rome</option>
            <option value="East Rome">East Rome</option>
            <option value="South Rome">South Rome</option>
            <option value="Downtown">Downtown Rome</option>
            <option value="Clocktower Hill">Clocktower Hill</option>
          </select>
          <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="multi-unit">Multi-Unit</option>
          </select>
          <button type="submit" className="cta-button" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Save Property</button>
        </form>
      )}

      {properties.length === 0 && !adding ? (
        <p className="empty-state">No properties added yet. Add one to get started with subscriptions and service tracking.</p>
      ) : (
        <div className="properties-list">
          {properties.map((p) => (
            <div key={p.id} className="property-card">
              <div className="property-card-header">
                <h4>{p.label}</h4>
                <button className="btn-sm btn-sm--danger" onClick={() => deleteProperty(p.id)}>Remove</button>
              </div>
              <p>{p.address_line1}</p>
              <p>{p.city}, {p.state} {p.zip}</p>
              {p.area && <span className="property-area">{p.area}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestsTab({ submissions }) {
  if (submissions.length === 0) {
    return <p className="empty-state">No requests yet. Use the <Link to="/#name-your-price">Name Your Price</Link> tool to submit one.</p>;
  }

  return (
    <div>
      <h2>My Requests</h2>
      <div className="requests-list">
        {submissions.map((s) => (
          <div key={s.id} className="request-card request-card--full">
            <div className="request-card-header">
              <span className={`request-status request-status--${s.status}`}>{s.status}</span>
              <span className="request-price">${(s.offered_price / 100).toFixed(0)}</span>
            </div>
            <p className="request-desc">{s.description}</p>
            {s.counter_price && (
              <p className="request-counter">Counter-offer: <strong>${(s.counter_price / 100).toFixed(0)}</strong></p>
            )}
            {s.admin_notes && <p className="request-notes">Note: {s.admin_notes}</p>}
            <p className="request-date">Submitted {new Date(s.created_at).toLocaleDateString()}</p>
          </div>
        ))}
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
      <h2>Account Settings</h2>
      <form className="settings-form" onSubmit={saveProfile}>
        <div className="settings-row">
          <div className="settings-field">
            <label>First Name</label>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="settings-field">
            <label>Last Name</label>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="settings-field">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" className="cta-button" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
