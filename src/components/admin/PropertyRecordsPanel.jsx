import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function PropertyRecordsPanel() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  const [activeTab, setActiveTab] = useState('logs');
  const [records, setRecords] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    service_type: 'Routine Maintenance',
    service_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    performed_by: 'Nailed It Property Services',
  });

  const [showEqForm, setShowEqForm] = useState(false);
  const [eqForm, setEqForm] = useState({
    equipment_type: 'HVAC',
    brand: '',
    model_number: '',
    serial_number: '',
    install_date: '',
    warranty_expiration: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchProperties(selectedCustomerId);
      setSelectedPropertyId('');
      setRecords([]);
      setEquipment([]);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRecords(selectedPropertyId);
      fetchEquipment(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  async function fetchCustomers() {
    const { data } = await supabase.from('customer_profiles').select('id, first_name, last_name, email').order('last_name');
    setCustomers(data || []);
  }

  async function fetchProperties(customerId) {
    const { data } = await supabase.from('customer_properties').select('*').eq('customer_id', customerId);
    setProperties(data || []);
  }

  async function fetchRecords(propertyId) {
    const { data } = await supabase.from('property_records').select('*').eq('property_id', propertyId).order('service_date', { ascending: false });
    setRecords(data || []);
  }

  async function fetchEquipment(propertyId) {
    const { data } = await supabase.from('property_equipment').select('*').eq('property_id', propertyId).order('equipment_type');
    setEquipment(data || []);
  }

  async function handleAddLog(e) {
    e.preventDefault();
    const costInCents = logForm.cost ? parseInt(parseFloat(logForm.cost) * 100) : null;
    const { error } = await supabase.from('property_records').insert({
      property_id: selectedPropertyId,
      service_type: logForm.service_type,
      service_date: logForm.service_date,
      description: logForm.description,
      cost: costInCents,
      performed_by: logForm.performed_by,
      verified: true
    });
    if (error) {
      alert('Error saving record: ' + error.message);
    } else {
      setShowLogForm(false);
      setLogForm({ ...logForm, description: '', cost: '' });
      fetchRecords(selectedPropertyId);
    }
  }

  async function handleAddEq(e) {
    e.preventDefault();
    const { error } = await supabase.from('property_equipment').insert({
      property_id: selectedPropertyId,
      ...eqForm,
      install_date: eqForm.install_date || null,
      warranty_expiration: eqForm.warranty_expiration || null,
    });
    if (error) {
      alert('Error saving equipment: ' + error.message);
    } else {
      setShowEqForm(false);
      setEqForm({ ...eqForm, brand: '', model_number: '', serial_number: '', notes: '' });
      fetchEquipment(selectedPropertyId);
    }
  }

  async function deleteRecord(id) {
    if (!confirm('Delete this record?')) return;
    await supabase.from('property_records').delete().eq('id', id);
    fetchRecords(selectedPropertyId);
  }

  async function deleteEquipment(id) {
    if (!confirm('Delete this equipment?')) return;
    await supabase.from('property_equipment').delete().eq('id', id);
    fetchEquipment(selectedPropertyId);
  }

  return (
    <>
      <h2>?? Property Records (Verified Upkeep)</h2>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', background: 'var(--bg-primary)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <label>Select Customer</label>
          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--admin-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <option value="">-- Choose Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Select Property</label>
          <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} disabled={!selectedCustomerId} style={{ width: '100%', padding: '8px', background: 'var(--admin-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <option value="">-- Choose Property --</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.address_line1}, {p.city}</option>)}
          </select>
        </div>
      </div>

      {selectedPropertyId && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '24px', background: 'var(--bg-primary)' }}>
          <div className="admin-subtabs" style={{ marginBottom: '16px' }}>
            <button className={activeTab === 'logs' ? 'admin-subtab admin-subtab--active' : 'admin-subtab'} onClick={() => setActiveTab('logs')}>Service Logs</button>
            <button className={activeTab === 'equipment' ? 'admin-subtab admin-subtab--active' : 'admin-subtab'} onClick={() => setActiveTab('equipment')}>Equipment & Warranties</button>
          </div>

          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>Maintenance & Repair Logs</h3>
                <button className="btn-sm" onClick={() => setShowLogForm(!showLogForm)}>+ Add Record</button>
              </div>

              {showLogForm && (
                <form onSubmit={handleAddLog} style={{ background: 'var(--admin-bg)', padding: '16px', borderRadius: '4px', marginBottom: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Service Type</label>
                      <select value={logForm.service_type} onChange={e => setLogForm({...logForm, service_type: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                        <option value="Routine Maintenance">Routine Maintenance</option>
                        <option value="Repair">Repair</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Date</label>
                      <input type="date" value={logForm.service_date} onChange={e => setLogForm({...logForm, service_date: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Cost ($)</label>
                      <input type="number" step="0.01" value={logForm.cost} onChange={e => setLogForm({...logForm, cost: e.target.value})} placeholder="Optional" style={{ width: '100%', padding: '8px' }} />
                    </div>
                  </div>
                  <div>
                    <label>Description of Work</label>
                    <textarea value={logForm.description} onChange={e => setLogForm({...logForm, description: e.target.value})} required style={{ width: '100%', padding: '8px', minHeight: '80px' }} placeholder="What was done?"></textarea>
                  </div>
                  <div>
                    <label>Performed By</label>
                    <input type="text" value={logForm.performed_by} onChange={e => setLogForm({...logForm, performed_by: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div>
                    <button type="submit" className="cta-button" style={{ padding: '8px 16px' }}>Save Record</button>
                    <button type="button" className="btn-sm" onClick={() => setShowLogForm(false)} style={{ marginLeft: '12px' }}>Cancel</button>
                  </div>
                </form>
              )}

              {records.length === 0 ? <p style={{ color: 'var(--text-sub)' }}>No service logs found.</p> : (
                <table className="admin-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Performed By</th><th>Cost</th><th>Actions</th></tr></thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.service_date).toLocaleDateString()}</td>
                        <td><span style={{ padding: '2px 8px', background: 'var(--admin-panel)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--accent)' }}>{r.service_type}</span></td>
                        <td>{r.description}</td>
                        <td>{r.performed_by}</td>
                        <td>{r.cost ? $ : '-'}</td>
                        <td>
                          <button className="btn-sm btn-sm--danger" onClick={() => deleteRecord(r.id)}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'equipment' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>Equipment & Systems</h3>
                <button className="btn-sm" onClick={() => setShowEqForm(!showEqForm)}>+ Add Equipment</button>
              </div>

              {showEqForm && (
                <form onSubmit={handleAddEq} style={{ background: 'var(--admin-bg)', padding: '16px', borderRadius: '4px', marginBottom: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Type</label>
                      <input type="text" value={eqForm.equipment_type} onChange={e => setEqForm({...eqForm, equipment_type: e.target.value})} required style={{ width: '100%', padding: '8px' }} placeholder="HVAC, Roof, etc." />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Brand</label>
                      <input type="text" value={eqForm.brand} onChange={e => setEqForm({...eqForm, brand: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Model Number</label>
                      <input type="text" value={eqForm.model_number} onChange={e => setEqForm({...eqForm, model_number: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Serial Number</label>
                      <input type="text" value={eqForm.serial_number} onChange={e => setEqForm({...eqForm, serial_number: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Install Date</label>
                      <input type="date" value={eqForm.install_date} onChange={e => setEqForm({...eqForm, install_date: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Warranty Exp</label>
                      <input type="date" value={eqForm.warranty_expiration} onChange={e => setEqForm({...eqForm, warranty_expiration: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                    </div>
                  </div>
                  <div>
                    <label>Notes</label>
                    <textarea value={eqForm.notes} onChange={e => setEqForm({...eqForm, notes: e.target.value})} style={{ width: '100%', padding: '8px' }}></textarea>
                  </div>
                  <div>
                    <button type="submit" className="cta-button" style={{ padding: '8px 16px' }}>Save Equipment</button>
                    <button type="button" className="btn-sm" onClick={() => setShowEqForm(false)} style={{ marginLeft: '12px' }}>Cancel</button>
                  </div>
                </form>
              )}

              {equipment.length === 0 ? <p style={{ color: 'var(--text-sub)' }}>No equipment logged.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {equipment.map(e => (
                    <div key={e.id} style={{ background: 'var(--admin-bg)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border)', position: 'relative' }}>
                      <button className="btn-sm btn-sm--danger" onClick={() => deleteEquipment(e.id)} style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 6px', fontSize: '0.7rem' }}>Del</button>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>{e.equipment_type}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                        {e.brand && <p style={{ margin: '4px 0' }}><strong>Brand:</strong> {e.brand}</p>}
                        {e.model_number && <p style={{ margin: '4px 0' }}><strong>Model:</strong> {e.model_number}</p>}
                        {e.serial_number && <p style={{ margin: '4px 0' }}><strong>Serial:</strong> {e.serial_number}</p>}
                        {e.install_date && <p style={{ margin: '4px 0' }}><strong>Installed:</strong> {new Date(e.install_date).toLocaleDateString()}</p>}
                        {e.warranty_expiration && <p style={{ margin: '4px 0', color: new Date(e.warranty_expiration) > new Date() ? '#4caf50' : '#f44336' }}><strong>Warranty:</strong> {new Date(e.warranty_expiration).toLocaleDateString()}</p>}
                        {e.notes && <p style={{ margin: '8px 0 0 0', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px' }}>{e.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
