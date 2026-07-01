import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STATUS_COLORS = { pending: '#ff8a00', scheduled: '#2196f3', in_progress: '#9c27b0', completed: '#4caf50', cancelled: '#999', on_hold: '#ff9800' };
const PRIORITY_COLORS = { routine: '#4caf50', important: '#2196f3', urgent: '#ff9800', emergency: '#f44336' };
const STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold'];
const PRIORITIES = ['routine', 'important', 'urgent', 'emergency'];
const SOURCES = ['admin_created', 'phone_call', 'tenant_portal', 'preventative_schedule', 'inspection', 'chat'];

export function WorkOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [form, setForm] = useState({
    customer_id: '', property_id: '', asset_id: '', title: '', description: '',
    priority: 'routine', source: 'admin_created', assigned_technician: 'Charles',
    materials_needed: '', estimated_hours: '', estimated_cost: '',
    scheduled_date: '', scheduled_time: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  async function fetchOrders() {
    const { data } = await supabase
      .from('work_orders')
      .select('*, customers(first_name, last_name), properties(address_line_1, zone)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, first_name, last_name').order('last_name');
    setCustomers(data || []);
  }

  async function fetchProperties(customerId) {
    const { data } = await supabase.from('properties').select('id, address_line_1, zone').eq('owner_id', customerId);
    setProperties(data || []);
  }

  async function fetchAssets(propertyId) {
    const { data } = await supabase.from('assets').select('id, name, category').eq('property_id', propertyId);
    setAssets(data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    await supabase.from('work_orders').insert({
      customer_id: form.customer_id,
      property_id: form.property_id,
      asset_id: form.asset_id || null,
      title: form.title,
      description: form.description,
      priority: form.priority,
      source: form.source,
      assigned_technician: form.assigned_technician || null,
      materials_needed: form.materials_needed || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
    });
    fetchOrders();
    setView('list');
    resetForm();
  }

  async function updateStatus(id, status) {
    const updates = { status };
    if (status === 'completed') updates.completed_date = new Date().toISOString();
    await supabase.from('work_orders').update(updates).eq('id', id);
    fetchOrders();
    if (selected?.id === id) setSelected({ ...selected, status, ...updates });
  }

  async function updateNotes(id, notes) {
    await supabase.from('work_orders').update({ technician_notes: notes }).eq('id', id);
    fetchOrders();
  }

  function resetForm() {
    setForm({ customer_id: '', property_id: '', asset_id: '', title: '', description: '', priority: 'routine', source: 'admin_created', assigned_technician: 'Charles', materials_needed: '', estimated_hours: '', estimated_cost: '', scheduled_date: '', scheduled_time: '' });
    setProperties([]);
    setAssets([]);
  }

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterPriority !== 'all' && o.priority !== filterPriority) return false;
    return true;
  });

  // CREATE FORM
  if (view === 'add') {
    return (
      <>
        <button className="btn-sm" onClick={() => { setView('list'); resetForm(); }}>&larr; Back</button>
        <h2 style={{ marginTop: '16px' }}>Create Work Order</h2>
        <form className="admin-form" onSubmit={handleCreate} style={{ maxWidth: '700px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Customer *</label>
              <select value={form.customer_id} onChange={(e) => { setForm({ ...form, customer_id: e.target.value, property_id: '', asset_id: '' }); fetchProperties(e.target.value); }} required>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div>
              <label>Property *</label>
              <select value={form.property_id} onChange={(e) => { setForm({ ...form, property_id: e.target.value, asset_id: '' }); fetchAssets(e.target.value); }} required>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.address_line_1} — {p.zone}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Asset (optional)</label>
              <select value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })}>
                <option value="">None</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
              </select>
            </div>
            <div>
              <label>Assigned Technician</label>
              <input type="text" value={form.assigned_technician} onChange={(e) => setForm({ ...form, assigned_technician: e.target.value })} />
            </div>
          </div>
          <div><label>Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Leaking kitchen faucet" /></div>
          <div><label>Description *</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Describe the issue or task..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label>Estimated Hours</label>
              <input type="number" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label>Scheduled Date</label>
              <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div>
              <label>Arrival Window</label>
              <input type="text" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} placeholder="9 AM - 11 AM" />
            </div>
            <div>
              <label>Est. Materials Cost ($)</label>
              <input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
            </div>
          </div>
          <div><label>Materials Needed</label><textarea value={form.materials_needed} onChange={(e) => setForm({ ...form, materials_needed: e.target.value })} placeholder="Quick checklist before heading to the site..." /></div>
          <button type="submit" className="cta-button" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.8rem' }}>Create Work Order</button>
        </form>
      </>
    );
  }

  // DETAIL VIEW
  if (view === 'detail' && selected) {
    return (
      <>
        <button className="btn-sm" onClick={() => { setView('list'); setSelected(null); }}>&larr; All Work Orders</button>
        <div className="customer-detail" style={{ marginTop: '16px' }}>
          <div className="customer-detail-header">
            <div>
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span className="customer-badge" style={{ background: STATUS_COLORS[selected.status] }}>{selected.status.replace(/_/g, ' ')}</span>
                <span className="customer-badge" style={{ background: PRIORITY_COLORS[selected.priority] }}>{selected.priority}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Source: {selected.source?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                <>
                  {selected.status === 'pending' && <button className="btn-sm" onClick={() => updateStatus(selected.id, 'scheduled')}>Schedule</button>}
                  {selected.status === 'scheduled' && <button className="btn-sm" onClick={() => updateStatus(selected.id, 'in_progress')}>Start</button>}
                  {(selected.status === 'in_progress' || selected.status === 'scheduled') && <button className="btn-sm btn-sm--success" onClick={() => updateStatus(selected.id, 'completed')}>Complete</button>}
                  <button className="btn-sm" onClick={() => updateStatus(selected.id, 'on_hold')}>Hold</button>
                  <button className="btn-sm btn-sm--danger" onClick={() => updateStatus(selected.id, 'cancelled')}>Cancel</button>
                </>
              )}
            </div>
          </div>

          <div className="customer-detail-body">
            <div>
              <div className="customer-detail-grid">
                <div className="detail-field"><span className="detail-label">Customer</span>{selected.customers?.first_name} {selected.customers?.last_name}</div>
                <div className="detail-field"><span className="detail-label">Property</span>{selected.properties?.address_line_1}</div>
                <div className="detail-field"><span className="detail-label">Zone</span>{selected.properties?.zone}</div>
                <div className="detail-field"><span className="detail-label">Technician</span>{selected.assigned_technician || '—'}</div>
                <div className="detail-field"><span className="detail-label">Scheduled</span>{selected.scheduled_date ? `${selected.scheduled_date} ${selected.scheduled_time || ''}` : '—'}</div>
                <div className="detail-field"><span className="detail-label">Completed</span>{selected.completed_date ? new Date(selected.completed_date).toLocaleDateString() : '—'}</div>
              </div>

              <div className="dashboard-section" style={{ marginTop: '16px' }}>
                <h3>Description</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.description}</p>
              </div>

              {selected.materials_needed && (
                <div className="dashboard-section" style={{ marginTop: '12px' }}>
                  <h3>Materials Needed</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', whiteSpace: 'pre-wrap' }}>{selected.materials_needed}</p>
                </div>
              )}
            </div>

            <div>
              <div className="customer-detail-grid">
                <div className="detail-field"><span className="detail-label">Est. Hours</span>{selected.estimated_hours || '—'}</div>
                <div className="detail-field"><span className="detail-label">Actual Hours</span>{selected.actual_hours || '—'}</div>
                <div className="detail-field"><span className="detail-label">Est. Cost</span>{selected.estimated_cost ? `$${selected.estimated_cost}` : '—'}</div>
                <div className="detail-field"><span className="detail-label">Actual Cost</span>{selected.actual_cost ? `$${selected.actual_cost}` : '—'}</div>
              </div>

              <div className="dashboard-section" style={{ marginTop: '16px' }}>
                <h3>Technician Notes</h3>
                <textarea
                  defaultValue={selected.technician_notes || ''}
                  onBlur={(e) => updateNotes(selected.id, e.target.value)}
                  placeholder="Log what was done in the field..."
                  style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // LIST VIEW
  return (
    <>
      <div className="customers-header">
        <h2>Work Orders ({filtered.length})</h2>
        <button className="cta-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => { resetForm(); setView('add'); }}>+ New Work Order</button>
      </div>

      <div className="customers-filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="customers-filter-select">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="customers-filter-select">
          <option value="all">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No work orders found.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Customer</th><th>Property</th><th>Priority</th><th>Status</th><th>Scheduled</th><th></th></tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{o.title}</td>
                <td>{o.customers?.first_name} {o.customers?.last_name}</td>
                <td>{o.properties?.address_line_1}</td>
                <td><span className="customer-badge" style={{ background: PRIORITY_COLORS[o.priority] }}>{o.priority}</span></td>
                <td><span className="customer-badge" style={{ background: STATUS_COLORS[o.status] }}>{o.status.replace(/_/g, ' ')}</span></td>
                <td>{o.scheduled_date || '—'}</td>
                <td><button className="btn-sm" onClick={() => { setSelected(o); setView('detail'); }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
