import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Admin.css';

function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        <h1>Admin Panel</h1>
        <p>Nailed It Property Solutions</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="cta-button">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin" style={{ position: 'relative' }}>
      <div className="admin-header-bar">
        <div className="admin-user-info">
          <p className="admin-user-name">{session.user.user_metadata?.full_name || session.user.email}</p>
          <p className="admin-user-id">ID: {session.user.id.substring(0, 8)}...</p>
        </div>
        <button className="btn-sm" onClick={handleLogout}>Logout</button>
      </div>
      <h1>Admin Dashboard</h1>

      <div className="admin-tabs">
        {['analytics', 'chat', 'reviews', 'faq', 'contacts', 'careers', 'settings'].map((t) => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' admin-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {tab === 'analytics' && <AnalyticsPanel />}
        {tab === 'chat' && <ChatPanel />}
        {tab === 'reviews' && <ReviewsPanel />}
        {tab === 'faq' && <FAQPanel />}
        {tab === 'contacts' && <ContactsPanel />}
        {tab === 'careers' && <CareersPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}

// Analytics Panel
function AnalyticsPanel() {
  const [stats, setStats] = useState({ total: 0, today: 0, pages: [] });

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
    }
    fetchStats();
  }, []);

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
      </div>
      <h2>Pages by Views</h2>
      <table className="admin-table">
        <thead><tr><th>Page</th><th>Views</th></tr></thead>
        <tbody>
          {stats.pages.map((p) => (
            <tr key={p.page}><td>{p.page}</td><td>{p.count}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
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
function ChatPanel() {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');

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
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !activeConvo) return;

    await supabase.from('chat_messages').insert({
      conversation_id: activeConvo,
      sender: 'admin',
      message: reply.trim(),
    });

    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConvo);

    setReply('');
  }

  async function closeConvo(id) {
    await supabase.from('chat_conversations').update({ status: 'closed' }).eq('id', id);
    fetchConversations();
    if (activeConvo === id) { setActiveConvo(null); setMessages([]); }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
      <div style={{ width: '250px', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
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
              background: activeConvo === c.id ? 'rgba(255,138,0,0.1)' : 'var(--bg-secondary)',
              border: `1px solid ${activeConvo === c.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '0.8rem',
            }}
          >
            <strong>{c.visitor_name || 'Visitor'}</strong>
            <br />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>
              {c.status === 'closed' ? '🔴 Closed' : '🟢 Active'}
            </span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {!activeConvo ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>Select a conversation to view messages.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3>Messages</h3>
              <button className="btn-sm btn-sm--danger" onClick={() => closeConvo(activeConvo)}>Close Chat</button>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '12px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '2px', border: '1px solid var(--border)' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ marginBottom: '8px', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    background: m.sender === 'admin' ? 'var(--accent)' : 'var(--bg-primary)',
                    color: m.sender === 'admin' ? '#1A1A1D' : 'var(--text)',
                    border: m.sender === 'visitor' ? '1px solid var(--border)' : 'none',
                  }}>
                    {m.message}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={sendReply} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply..."
                style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '2px', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.85rem' }}
              />
              <button type="submit" className="cta-button" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
