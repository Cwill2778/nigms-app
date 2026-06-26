import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
