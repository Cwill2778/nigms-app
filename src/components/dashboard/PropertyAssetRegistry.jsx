import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const EQUIPMENT_CATEGORIES = [
  'HVAC & Air Handler',
  'Water Heater',
  'Electrical Panel',
  'Roof & Gutter System',
  'Sump Pump & Drainage',
  'Plumbing Main & Pressure Regulator',
  'Kitchen Appliances',
  'Garage Door & Opener',
  'Whole-House Generator',
  'Other Equipment'
];

export function PropertyAssetRegistry({ properties = [], userId }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    equipment_type: 'HVAC & Air Handler',
    brand: '',
    model_number: '',
    serial_number: '',
    install_date: '',
    warranty_expiration: '',
    notes: ''
  });

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchEquipment(selectedPropertyId);
    } else {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  async function fetchEquipment(propertyId) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_equipment')
        .select('*')
        .eq('property_id', propertyId)
        .order('equipment_type');

      if (error) throw error;
      setEquipmentList(data || []);
    } catch (err) {
      console.error('Error fetching property equipment:', err);
      toast.error('Failed to load equipment registry.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEquipment(e) {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error('Please select a property first.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('property_equipment')
        .insert({
          property_id: selectedPropertyId,
          equipment_type: form.equipment_type,
          brand: form.brand.trim() || null,
          model_number: form.model_number.trim() || null,
          serial_number: form.serial_number.trim() || null,
          install_date: form.install_date || null,
          warranty_expiration: form.warranty_expiration || null,
          notes: form.notes.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${form.equipment_type} registered successfully!`);
      setEquipmentList([data, ...equipmentList]);
      setShowAddModal(false);
      setForm({
        equipment_type: 'HVAC & Air Handler',
        brand: '',
        model_number: '',
        serial_number: '',
        install_date: '',
        warranty_expiration: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding equipment:', err);
      toast.error(err.message || 'Failed to save equipment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEquipment(id, name) {
    if (!confirm(`Are you sure you want to remove "${name}" from this property's registry?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Equipment record removed.');
      setEquipmentList(equipmentList.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete equipment.');
    }
  }

  if (properties.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
        <span className="text-4xl block mb-3">🏠</span>
        <h3 className="text-xl font-heading font-bold text-white uppercase tracking-wider mb-2">
          No Properties Registered
        </h3>
        <p className="text-[#a0a0a0] text-sm max-w-md mx-auto mb-6">
          Add your property under the Properties tab to begin registering critical mechanical equipment and warranty coverage.
        </p>
      </div>
    );
  }

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  return (
    <div className="space-y-8">
      {/* HEADER & PROPERTY SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider flex items-center gap-3">
            <span>Property Technical Asset Registry</span>
            <span className="text-xs px-2.5 py-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/30 rounded-full font-mono uppercase tracking-widest">
              Mechanical Specs
            </span>
          </h2>
          <p className="text-sm text-[#a0a0a0] mt-1">
            Central repository of HVAC systems, water heaters, roof age, and warranty expirations for your home.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* PROPERTY SELECTOR */}
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || p.address_line1} ({p.city})
              </option>
            ))}
          </select>

          {/* ADD ASSET BUTTON */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(255,95,31,0.25)] flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Register Equipment</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS FOR SELECTED PROPERTY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Cataloged Systems</p>
          <p className="text-3xl font-heading font-bold text-white">{equipmentList.length}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Active Manufacturer Warranties</p>
          <p className="text-3xl font-heading font-bold text-green-400">
            {equipmentList.filter((e) => e.warranty_expiration && new Date(e.warranty_expiration) > new Date()).length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Inspecting Service Partner</p>
          <p className="text-base font-bold text-brand-gold mt-1">Nailed It Property Solutions LLC</p>
        </div>
      </div>

      {/* EQUIPMENT CARDS GRID */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-mono text-sm">Querying property mechanical equipment...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
          <span className="text-4xl block mb-3">🔧</span>
          <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
            No Equipment Logged for this Property
          </h3>
          <p className="text-[#a0a0a0] text-sm max-w-md mx-auto mb-6">
            Keep track of your HVAC model, water heater age, filter dimensions, and warranty expirations in one central hub.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer"
          >
            + Add First Equipment Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList.map((item) => {
            const hasWarranty = Boolean(item.warranty_expiration);
            const isWarrantyActive = hasWarranty && new Date(item.warranty_expiration) > new Date();

            return (
              <div
                key={item.id}
                className="bg-[#111111] border border-white/10 hover:border-white/20 rounded-xl p-6 flex flex-col justify-between transition-all shadow-md group"
              >
                <div>
                  {/* CARD HEADER */}
                  <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-gold font-mono block mb-1">
                        {item.equipment_type}
                      </span>
                      <h4 className="text-lg font-bold text-white">
                        {item.brand ? `${item.brand} ` : ''}{item.model_number || 'Standard Unit'}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteEquipment(item.id, item.equipment_type)}
                      className="text-white/30 hover:text-red-400 p-1 transition-colors cursor-pointer text-sm"
                      title="Remove from registry"
                    >
                      ✕
                    </button>
                  </div>

                  {/* SPECS LIST */}
                  <div className="space-y-2 text-xs text-[#a0a0a0] mb-4">
                    {item.serial_number && (
                      <div className="flex justify-between">
                        <span>Serial Number:</span>
                        <span className="font-mono text-white font-medium">{item.serial_number}</span>
                      </div>
                    )}
                    {item.install_date && (
                      <div className="flex justify-between">
                        <span>Install Date:</span>
                        <span className="text-white">{new Date(item.install_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="pt-2 border-t border-white/5 text-[11px] text-white/70 italic">
                        &quot;{item.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* WARRANTY STATUS BADGE */}
                <div className="pt-3 border-t border-white/10">
                  {hasWarranty ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#a0a0a0]">Warranty Status:</span>
                      <span
                        className={`font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          isWarrantyActive
                            ? 'text-green-400 bg-green-950/40 border border-green-800/40'
                            : 'text-red-400 bg-red-950/40 border border-red-800/40'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isWarrantyActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        {isWarrantyActive ? 'Active Warranty' : 'Expired'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-white/40">
                      <span>Warranty:</span>
                      <span>Not Registered</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD EQUIPMENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-white/20 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 text-white relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-heading font-bold uppercase tracking-wider text-white">
                  Register Equipment Asset
                </h3>
                <p className="text-xs text-[#a0a0a0] mt-0.5">
                  Adding to {selectedProperty.address_line1}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Equipment Category</label>
                <select
                  value={form.equipment_type}
                  onChange={(e) => setForm({ ...form, equipment_type: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  required
                >
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Carrier, Rheem, Square D"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Model #</label>
                  <input
                    type="text"
                    placeholder="e.g. Performance 16 SEER"
                    value={form.model_number}
                    onChange={(e) => setForm({ ...form, model_number: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-84920492"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={form.install_date}
                    onChange={(e) => setForm({ ...form, install_date: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Warranty Expiration</label>
                  <input
                    type="date"
                    value={form.warranty_expiration}
                    onChange={(e) => setForm({ ...form, warranty_expiration: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#a0a0a0] mb-1">Maintenance Notes & Filter Specs</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Filter size 16x25x1 (MERV 11). Last checked by Charles in Oct."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase text-xs tracking-wider px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Save to Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
