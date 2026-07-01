import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['hvac', 'plumbing', 'electrical', 'structural', 'appliance', 'exterior', 'roofing', 'flooring', 'other'];
const CONDITIONS = ['good', 'fair', 'poor', 'failed', 'unknown'];
const CONDITION_COLORS = { good: '#4caf50', fair: '#ff9800', poor: '#f44336', failed: '#880000', unknown: '#999' };

export function AssetsPanel() {
  const [assets, setAssets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    property_id: '', customer_id: '', category: 'hvac', name: '', model: '',
    serial_number: '', condition: 'unknown', install_date: '', warranty_expiry: '',
    maintenance_interval_months: '6', notes: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchCustomers();
  }, []);

  async function fetchAssets() {
    const { data } = await supabase
      .from('assets')
      .select('*, properties(address_line_1, zone, owner_id, customers:owner_id(first_name, last_name))')
      .order('next_service_due', { ascending: true, nullsFirst: false });
    setAssets(data || []);
  }

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, first_name, last_name').order('last_name');
    setCustomers(data || []);
  }

  async function fetchProperties(customerId) {
    const { data } = await supabase.from('properties').select('id, address_line_1, zone').eq('owner_id', customerId);
    setProperties(data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const installDate = form.install_date || null;
    let nextDue = null;
    if (installDate && form.maintenance_interval_months) {
      const d = new Date(installDate);
      d.setMonth(d.getMonth() + parseInt(form.maintenance_interval_months));
      nextDue = d.toISOString().split('T')[0];
    }
    await supabase.from('assets').insert({
      property_id: form.property_id,
      category: form.category,
      name: form.name,
      model: form.model || null,
      serial_number: form.serial_number || null,
      condition: form.condition,
      install_date: installDate,
      warranty_expiry: form.warranty_expiry || null,
      maintenance_interval_months: parseInt(form.maintenance_interval_months) || 6,
      next_service_due: nextDue,
      notes: form.notes || null,
    });
    fetchAssets();
    setView('list');
    resetForm();
  }

  async function markServiced(id) {
    const today = new Date().toISOString().split('T')[0];
    const asset = assets.find((a) => a.id === id);
    const interval = asset?.maintenance_interval_months || 6;
    const next = new Date();
    next.setMonth(next.getMonth() + interval);
    await supabase.from('assets').update({
      last_serviced_date: today,
      next_service_due: next.toISOString().split('T')[0],
    }).eq('id', id);
    fetchAssets();
  }

  async function updateCondition(id, condition) {
    await supabase.from('assets').update({ condition }).eq('id', id);
    fetchAssets();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this asset?')) return;
    await supabase.from('assets').delete().eq('id', id);
    fetchAssets();
    if (selected?.id === id) { setView('list'); setSelected(null); }
  }

  function resetForm() {
    setForm({ property_id: '', customer_id: '', category: 'hvac', name: '', model: '', serial_number: '', condition: 'unknown', install_date: '', warranty_expiry: '', maintenance_interval_months: '6', notes: '' });
    setProperties([]);
  }

  function isDueSoon(dateStr) {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const now = new Date();
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  const filtered = assets.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterCondition !== 'all' && a.condition !== filterCondition) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return a.name.toLowerCase().includes(term) || (a.properties?.address_line_1 || '').toLowerCase().includes(term);
    }
    return true;
  });

  const overdueCount = assets.filter((a) => isOverdue(a.next_service_due)).length;
  const dueSoonCount = assets.filter((a) => !isOverdue(a.next_service_due) && isDueSoon(a.next_service_due)).length;

  // ADD FORM
  if (view === 'add') {
    return (
      <>
        <button className="btn-sm" onClick={() => { setView('list'); resetForm(); }}>&larr; Back</button>
        <h2 style={{ marginTop: '16px' }}>Add Asset</h2>
        <form className="admin-form" onSubmit={handleCreate} style={{ maxWidth: '700px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Customer *</label>
              <select value={form.customer_id} onChange={(e) => { setForm({ ...form, customer_id: e.target.value, property_id: '' }); fetchProperties(e.target.value); }} required>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div>
              <label>Property *</label>
              <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} required>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.address_line_1} — {p.zone}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label>Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Downstairs Heat Pump" /></div>
            <div>
              <label>Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label>Model</label><input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div><label>Serial Number</label><input type="text" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div><label>Install Date</label><input type="date" value={form.install_date} onChange={(e) => setForm({ ...form, install_date: e.target.value })} /></div>
            <div><label>Warranty Expires</label><input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></div>
            <div><label>Service Interval (months)</label><input type="number" value={form.maintenance_interval_months} onChange={(e) => setForm({ ...form, maintenance_interval_months: e.target.value })} /></div>
          </div>
          <div><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Filter size, paint color, special instructions..." /></div>
          <button type="submit" className="cta-button" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.8rem' }}>Add Asset</button>
        </form>
      </>
    );
  }

  // LIST VIEW
  return (
    <>
      <div className="customers-header">
        <h2>Assets ({filtered.length})</h2>
        <button className="cta-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => { resetForm(); setView('add'); }}>+ Add Asset</button>
      </div>

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {overdueCount > 0 && <span className="customer-badge" style={{ background: '#f44336', fontSize: '0.75rem', padding: '4px 12px' }}>🚨 {overdueCount} overdue</span>}
          {dueSoonCount > 0 && <span className="customer-badge" style={{ background: '#ff9800', fontSize: '0.75rem', padding: '4px 12px' }}>⚠️ {dueSoonCount} due within 30 days</span>}
        </div>
      )}

      <div className="customers-filters">
        <input type="text" placeholder="Search name or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="customers-search" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="customers-filter-select">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} className="customers-filter-select">
          <option value="all">All Conditions</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No assets found.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Property</th><th>Condition</th><th>Next Service</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td>{a.category}</td>
                <td>{a.properties?.address_line_1 || '—'}</td>
                <td><span className="customer-badge" style={{ background: CONDITION_COLORS[a.condition] }}>{a.condition}</span></td>
                <td style={{ color: isOverdue(a.next_service_due) ? '#f44336' : isDueSoon(a.next_service_due) ? '#ff9800' : 'var(--text-sub)', fontWeight: isOverdue(a.next_service_due) ? 700 : 400 }}>
                  {a.next_service_due || '—'}
                  {isOverdue(a.next_service_due) && ' ⚠️'}
                </td>
                <td>
                  <button className="btn-sm btn-sm--success" onClick={() => markServiced(a.id)}>Serviced</button>
                  <button className="btn-sm btn-sm--danger" onClick={() => handleDelete(a.id)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
