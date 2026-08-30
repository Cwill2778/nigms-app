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

  async function handleAdd(e) {
    e.preventDefault();
    await supabase.from('work_orders').insert({
      ...form,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      estimated_cost: form.estimated_cost ? parseInt(form.estimated_cost * 100) : null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      asset_id: form.asset_id || null,
    });
    fetchOrders();
    setView('list');
    setForm({ customer_id: '', property_id: '', asset_id: '', title: '', description: '', priority: 'routine', source: 'admin_created', assigned_technician: 'Charles', materials_needed: '', estimated_hours: '', estimated_cost: '', scheduled_date: '', scheduled_time: '' });
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('work_orders').update({ status: newStatus }).eq('id', id);
    fetchOrders();
    if (selected && selected.id === id) {
      setSelected({ ...selected, status: newStatus });
    }
  }

  async function quickAssign(id, tech) {
    await supabase.from('work_orders').update({ assigned_technician: tech }).eq('id', id);
    fetchOrders();
  }

  async function saveNotes(id, notes) {
    await supabase.from('work_orders').update({ technician_notes: notes }).eq('id', id);
    fetchOrders();
  }

  function openDetail(wo) {
    setSelected(wo);
    setView('detail');
  }

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterPriority !== 'all' && o.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* MAIN LIST */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>Work Orders ({filtered.length})</h2>
          <button className="cta-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => { setView('add'); setSelected(null); }}>+ New Order</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--admin-border)', background: 'var(--admin-panel)', color: 'var(--admin-text)' }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--admin-border)', background: 'var(--admin-panel)', color: 'var(--admin-text)' }}>
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--admin-text-sub)' }}>No work orders found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((wo) => (
              <div key={wo.id} onClick={() => openDetail(wo)} style={{ background: selected?.id === wo.id ? 'var(--admin-accent-glow)' : 'var(--admin-panel)', padding: '16px', borderRadius: '6px', border: `1px solid ${selected?.id === wo.id ? 'var(--admin-accent)' : 'var(--admin-border)'}`, borderLeft: `4px solid ${PRIORITY_COLORS[wo.priority] || 'var(--admin-border)'}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-text)' }}>{wo.title}</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '3px', background: STATUS_COLORS[wo.status] || '#555', color: '#fff', fontWeight: 'bold' }}>{wo.status.toUpperCase().replace('_', ' ')}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>
                  {wo.properties?.address_line_1 || 'No Property'} | {wo.customers?.first_name} {wo.customers?.last_name}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--admin-accent)' }}>{wo.assigned_technician ? `👷 ${wo.assigned_technician}` : 'Unassigned'}</span>
                  <span>{new Date(wo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL POPUP */}
      {view !== 'list' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          
          {view === 'add' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Create Work Order</h2>
                <button className="btn-sm" onClick={() => setView('list')}>Close</button>
              </div>
              <form className="admin-form" onSubmit={handleAdd} style={{ maxWidth: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label>Customer *</label>
                    <select value={form.customer_id} onChange={(e) => { setForm({ ...form, customer_id: e.target.value, property_id: '', asset_id: '' }); fetchProperties(e.target.value); }} required>
                      <option value="">Select Customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.last_name}, {c.first_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Property *</label>
                    <select value={form.property_id} onChange={(e) => { setForm({ ...form, property_id: e.target.value, asset_id: '' }); fetchAssets(e.target.value); }} required disabled={!form.customer_id}>
                      <option value="">Select Property...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.address_line_1} ({p.zone})</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label>Task Title *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Replace HVAC Filter" />
                  </div>
                  <div>
                    <label>Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label>Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label>Scheduled Date</label>
                    <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                  </div>
                  <div>
                    <label>Scheduled Time</label>
                    <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="cta-button" style={{ marginTop: '24px' }}>Create Work Order</button>
              </form>
            </>
          )}

          {view === 'detail' && selected && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{selected.title}</h2>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                    <span style={{ color: PRIORITY_COLORS[selected.priority] }}>🔥 {selected.priority.toUpperCase()}</span>
                    <span>📍 {selected.properties?.address_line_1}</span>
                    <span>👤 {selected.customers?.first_name} {selected.customers?.last_name}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <button className="btn-sm" onClick={() => setView('list')}>Close</button>
                  <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)} style={{ padding: '6px 12px', background: STATUS_COLORS[selected.status] || '#555', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px' }}>Details</h3>
                  <p style={{ background: 'var(--admin-bg)', padding: '16px', borderRadius: '4px', fontSize: '0.9rem', lineHeight: 1.6 }}>{selected.description}</p>
                  
                  <h3 style={{ fontSize: '1rem', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px' }}>Technician Notes</h3>
                  <textarea 
                    defaultValue={selected.technician_notes || ''} 
                    onBlur={(e) => saveNotes(selected.id, e.target.value)}
                    placeholder="Add private notes or updates here. (Saves automatically on click away)"
                    style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ background: 'var(--admin-bg)', padding: '16px', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--admin-text-sub)' }}>Metadata</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div><strong>Assigned Tech:</strong> {selected.assigned_technician || 'None'}</div>
                    <div><strong>Scheduled:</strong> {selected.scheduled_date ? `${selected.scheduled_date} ${selected.scheduled_time || ''}` : 'Not scheduled'}</div>
                    <div><strong>Source:</strong> {selected.source.replace('_', ' ')}</div>
                    <div><strong>Est. Hours:</strong> {selected.estimated_hours || 'N/A'}</div>
                    <div><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</div>
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
