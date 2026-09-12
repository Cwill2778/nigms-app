import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function RecordsTab({ properties }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState('logs');
  const [records, setRecords] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRecords(selectedPropertyId);
      fetchEquipment(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  async function fetchRecords(propertyId) {
    const { data } = await supabase.from('property_records').select('*').eq('property_id', propertyId).order('service_date', { ascending: false });
    setRecords(data || []);
  }

  async function fetchEquipment(propertyId) {
    const { data } = await supabase.from('property_equipment').select('*').eq('property_id', propertyId).order('equipment_type');
    setEquipment(data || []);
  }

  if (!properties || properties.length === 0) {
    return (
      <div>
        <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider mb-4">Property Health & Records</h2>
        <p className="text-[#a0a0a0]">You have no properties listed. Please add a property first.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider">Property Health & Records</h2>
        <select 
          value={selectedPropertyId} 
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="bg-[#0A0A0A] border-none rounded-md p-2 text-white shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.address_line1}, {p.city}</option>
          ))}
        </select>
      </div>

      <div className="flex space-x-2 mb-8">
        <button 
          className={activeTab === 'logs' ? 'px-6 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-sm transition-colors bg-brand-gold text-[#0A0A0A]' : 'px-6 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-sm transition-colors bg-[#111111] text-[#a0a0a0] hover:text-white border border-white/10'}
          onClick={() => setActiveTab('logs')}
        >
          Service Logs
        </button>
        <button 
          className={activeTab === 'equipment' ? 'px-6 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-sm transition-colors bg-brand-gold text-[#0A0A0A]' : 'px-6 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-sm transition-colors bg-[#111111] text-[#a0a0a0] hover:text-white border border-white/10'}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment & Warranties
        </button>
      </div>

      {activeTab === 'logs' && (
        <div>
          {records.length === 0 ? (
            <p className="text-[#a0a0a0]">No maintenance records found for this property.</p>
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="bg-[#111111] border border-white/10 rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        {r.service_type}
                      </span>
                      <h4 className="text-white font-bold">{new Date(r.service_date).toLocaleDateString()}</h4>
                    </div>
                    {r.verified && (
                      <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Verified Record
                      </span>
                    )}
                  </div>
                  <p className="text-[#a0a0a0] text-sm mb-4">{r.description}</p>
                  <p className="text-xs text-brand-gold/70">Performed by: {r.performed_by}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div>
          {equipment.length === 0 ? (
            <p className="text-[#a0a0a0]">No equipment logged for this property.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {equipment.map(e => (
                <div key={e.id} className="bg-[#111111] border border-white/10 rounded-xl p-6 shadow-md">
                  <h4 className="text-brand-gold font-heading font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">{e.equipment_type}</h4>
                  <div className="space-y-2 text-sm">
                    {e.brand && <p><span className="text-[#a0a0a0]">Brand:</span> <span className="text-white font-medium">{e.brand}</span></p>}
                    {e.model_number && <p><span className="text-[#a0a0a0]">Model:</span> <span className="text-white font-medium">{e.model_number}</span></p>}
                    {e.serial_number && <p><span className="text-[#a0a0a0]">Serial:</span> <span className="text-white font-medium">{e.serial_number}</span></p>}
                    {e.install_date && <p><span className="text-[#a0a0a0]">Installed:</span> <span className="text-white font-medium">{new Date(e.install_date).toLocaleDateString()}</span></p>}
                    
                    {e.warranty_expiration && (
                      <p className="pt-2 mt-2 border-t border-white/5">
                        <span className="text-[#a0a0a0]">Warranty:</span>{' '}
                        <span className={new Date(e.warranty_expiration) > new Date() ? 'font-bold text-green-400' : 'font-bold text-red-400'}>
                          {new Date(e.warranty_expiration).toLocaleDateString()}
                          {new Date(e.warranty_expiration) > new Date() ? ' (Active)' : ' (Expired)'}
                        </span>
                      </p>
                    )}
                  </div>
                  {e.notes && (
                    <div className="mt-4 p-3 bg-[#0A0A0A] rounded border border-white/5 text-xs text-[#a0a0a0]">
                      {e.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
