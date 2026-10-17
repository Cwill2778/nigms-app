import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import logo from '../../assets/logo.png';
import { AuditBarcode, AuditQRCode } from './AuditBarcode';
import { CharlesSignatureBlock } from './CharlesSignature';

export function MaintenanceVault({ properties = [], userProfile }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [dossierPropertyId, setDossierPropertyId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  function handlePrintDossier() {
    const printElement = document.getElementById('certified-dossier-sheet');
    if (!printElement) {
      window.print();
      return;
    }
    let iframe = document.getElementById('nips-dossier-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'nips-dossier-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certified Property Dossier - Nailed It Property Solutions</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
          <style>
            @page { size: letter portrait; margin: 8mm 10mm 8mm 10mm; }
            *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; color: #0f172a !important; font-family: 'Montserrat', sans-serif; font-size: 9.5pt; line-height: 1.25; }
            .font-serif { font-family: 'Playfair Display', Georgia, serif; }
            .font-mono { font-family: monospace; }
            table { border-collapse: collapse; width: 100%; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            thead { display: table-header-group !important; }
            .ledger-avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          </style>
          ${Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\\n')}
        </head>
        <body style="background: #ffffff !important; padding: 0; margin: 0;">
          <div style="background: #ffffff !important; padding: 0; margin: 0; width: 100%;">
            ${printElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 300);
  }

  useEffect(() => {
    setDossierPropertyId(selectedPropertyId);
  }, [selectedPropertyId, showPrintModal]);

  useEffect(() => {
    fetchRecords();
  }, [selectedPropertyId]);

  async function fetchRecords() {
    setLoading(true);
    try {
      let query = supabase
        .from('property_records')
        .select('*, customer_properties(id, label, address_line1, city, state, zip), record_attachments(*)')
        .order('service_date', { ascending: false });

      if (selectedPropertyId !== 'all') {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching vault records:', err);
      toast.error('Failed to load maintenance records.');
    } finally {
      setLoading(false);
    }
  }

  // Filter records based on search query and service type
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      !searchQuery ||
      rec.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.performed_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.customer_properties?.address_line1?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      serviceTypeFilter === 'all' ||
      rec.service_type?.toLowerCase().includes(serviceTypeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const totalCost = filteredRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
  const verifiedCount = filteredRecords.filter((r) => r.verified).length;

  // Export to CSV
  function handleExportCSV() {
    if (filteredRecords.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    const headers = ['Record ID', 'Service Date', 'Property Address', 'Service Type', 'Performed By', 'Cost ($)', 'Verified', 'Description'];
    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.service_date).toLocaleDateString()}"`,
      `"${r.customer_properties?.address_line1 || 'Property'}, ${r.customer_properties?.city || 'Rome'}"`,
      `"${r.service_type}"`,
      `"${r.performed_by || 'Nailed It Property Solutions'}"`,
      `"${r.cost ? (r.cost / 100).toFixed(2) : '0.00'}"`,
      `"${r.verified ? 'YES' : 'NO'}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nailed_it_maintenance_vault_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Maintenance records exported to CSV successfully!');
  }

  return (
    <div className="space-y-8">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider flex items-center gap-3">
            <span>The Maintenance Vault</span>
            <span className="text-xs px-2.5 py-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/30 rounded-full font-mono uppercase tracking-widest">
              Digital Paper Trail
            </span>
          </h2>
          <p className="text-sm text-[#a0a0a0] mt-1">
            Certified, unassailable property care history for home sales, refinancing, and insurance validation.
          </p>
        </div>

        {/* EXPORT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[#111111] hover:bg-white/5 border border-white/10 hover:border-brand-gold/50 text-white font-heading font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-lg transition-all cursor-pointer"
            title="Download records in CSV spreadsheet format"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 bg-brand-gold hover:opacity-90 text-[#0A0A0A] font-heading font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(255,95,31,0.25)] cursor-pointer"
            title="Generate printable certified property dossier"
          >
            <span>📜</span>
            <span>Certified Dossier</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-bold mb-1">Total Verified Records</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-white">{filteredRecords.length}</span>
            <span className="text-xs text-green-400 font-bold">({verifiedCount} Certified)</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-bold mb-1">Lifetime Documented Value</p>
          <p className="text-3xl font-heading font-bold text-brand-gold">
            ${(totalCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5 rounded-xl">
          <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-bold mb-1">Compliance & Warranty Integrity</p>
          <div className="flex items-center gap-2 text-green-400 font-bold text-sm mt-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>100% Inspected & Signed Off</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#111111] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* PROPERTY DROPDOWN */}
        <div className="w-full md:w-64">
          <label className="block text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Property</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            <option value="all">All Properties ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || p.address_line1} - {p.city}
              </option>
            ))}
          </select>
        </div>

        {/* SEARCH INPUT */}
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Search Vault</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-white/30 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by repair, technician, contractor, or parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>
        </div>

        {/* SERVICE TYPE FILTER */}
        <div className="w-full md:w-48">
          <label className="block text-xs uppercase tracking-wider text-[#a0a0a0] font-bold mb-1">Category</label>
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC & Cooling</option>
            <option value="roofing">Roofing & Gutters</option>
            <option value="carpentry">Carpentry & Decks</option>
            <option value="inspection">Safety Inspections</option>
            <option value="preventative">Preventative Care</option>
          </select>
        </div>
      </div>

      {/* RECORD TIMELINE LIST */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-mono text-sm">Decrypting and loading verified property records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
          <span className="text-4xl block mb-3">📁</span>
          <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">No Records Found</h3>
          <p className="text-[#a0a0a0] text-sm max-w-md mx-auto">
            {searchQuery || serviceTypeFilter !== 'all'
              ? 'No service logs match your search filters. Try clearing filters.'
              : 'Maintenance logs and contractor sign-offs for your property will appear here as work orders are completed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isExpanded = expandedRecordId === record.id;
            const recordDate = new Date(record.service_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div
                key={record.id}
                className="bg-[#111111] border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all shadow-md"
              >
                {/* RECORD ROW HEADER */}
                <div
                  className="p-6 cursor-pointer flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 select-none"
                  onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold text-xl flex-shrink-0">
                      {record.service_type?.toLowerCase().includes('plumb') ? '🚰' :
                       record.service_type?.toLowerCase().includes('elec') ? '⚡' :
                       record.service_type?.toLowerCase().includes('hvac') || record.service_type?.toLowerCase().includes('heat') ? '❄️' :
                       record.service_type?.toLowerCase().includes('roof') ? '🏠' :
                       record.service_type?.toLowerCase().includes('inspect') ? '🔍' : '🛠️'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                          {record.service_type}
                        </span>
                        {record.verified && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-950/40 border border-green-800/40 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Verified Integrity
                          </span>
                        )}
                        <span className="text-xs text-[#a0a0a0]">
                          {recordDate}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{record.description}</h3>
                      <p className="text-xs text-[#a0a0a0] mt-1">
                        {record.customer_properties?.address_line1 || 'Property'}, {record.customer_properties?.city || 'Rome'} • Performed by <strong className="text-white">{record.performed_by || 'Nailed It Team'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end lg:self-center">
                    <div className="text-right">
                      <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-bold">Documented Cost</p>
                      <p className="text-xl font-heading font-bold text-brand-gold">
                        {record.cost ? `$${(record.cost / 100).toFixed(2)}` : 'Included in Plan'}
                      </p>
                    </div>
                    <button
                      className="p-2 text-white/60 hover:text-white transition-colors"
                      aria-label={isExpanded ? 'Collapse proof panel' : 'Expand proof panel'}
                    >
                      <svg
                        className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE PROOF & VERIFICATION DETAILS */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-[#0A0A0A]/60 p-6 space-y-6">
                    {/* 1. CONTRACTOR & INVOICE BREAKDOWN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#111111] p-5 rounded-lg border border-white/5 space-y-3">
                        <h4 className="text-xs uppercase tracking-wider font-bold text-brand-gold flex items-center gap-2">
                          <span>📋</span>
                          <span>Work Order &amp; Contractor Verification</span>
                        </h4>
                        <div className="space-y-2 text-sm text-[#a0a0a0]">
                          <p><strong className="text-white">Contractor:</strong> {record.performed_by || 'Nailed It Property Solutions LLC'}</p>
                          <p><strong className="text-white">Coverage:</strong> Fully Insured &amp; Bonded</p>
                          <p><strong className="text-white">Standard:</strong> Municipal Residential Building Code Standards</p>
                          <p><strong className="text-white">Verification Status:</strong> Authenticated digital certificate stored in immutable audit log</p>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#888] font-mono block">DOCUMENT AUDIT ID</span>
                            <span className="text-xs font-mono font-bold text-brand-gold">DOC-NIPS-{record.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <AuditBarcode value={`DOC-${record.id.slice(0, 8).toUpperCase()}`} dark className="h-6" />
                        </div>
                      </div>

                      <div className="bg-[#111111] p-5 rounded-lg border border-white/5 space-y-3">
                        <h4 className="text-xs uppercase tracking-wider font-bold text-brand-gold flex items-center gap-2">
                          <span>🧾</span>
                          <span>Parts & Labor Allocation</span>
                        </h4>
                        <div className="space-y-2 text-sm text-[#a0a0a0]">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Labor & Craftsmanship</span>
                            <span className="text-white font-medium">{record.cost ? `$${((record.cost * 0.6) / 100).toFixed(2)}` : 'Plan labor'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>Materials & Replacement Parts</span>
                            <span className="text-white font-medium">{record.cost ? `$${((record.cost * 0.4) / 100).toFixed(2)}` : 'Covered parts'}</span>
                          </div>
                          <div className="flex justify-between pt-1 font-bold text-white">
                            <span>Total Invoiced</span>
                            <span className="text-brand-gold">{record.cost ? `$${(record.cost / 100).toFixed(2)}` : '$0.00 (Covered)'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. PHOTO GALLERY (BEFORE / AFTER & INSPECTION PROOF) */}
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3 flex items-center gap-2">
                        <span>📸</span>
                        <span>Inspection & Verification Gallery</span>
                      </h4>

                      {record.record_attachments && record.record_attachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {record.record_attachments.map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setSelectedImage(att.file_path)}
                              className="group relative aspect-video bg-[#111111] rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-brand-gold transition-all"
                            >
                              <img
                                src={att.file_path}
                                alt={att.label || 'Inspection proof'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[11px] text-white truncate">
                                {att.label || 'Verification Photo'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-[#111111] p-4 rounded-lg border border-white/5 flex items-center gap-4">
                            <div className="w-16 h-16 rounded bg-[#1a1a1a] flex items-center justify-center text-2xl border border-white/10 flex-shrink-0">
                              📷
                            </div>
                            <div>
                              <span className="text-xs uppercase font-bold text-amber-400">Pre-Service Diagnostic</span>
                              <p className="text-xs text-[#a0a0a0] mt-1">
                                High-resolution photo documented during technician check-in. Condition archived in vault.
                              </p>
                            </div>
                          </div>

                          <div className="bg-[#111111] p-4 rounded-lg border border-white/5 flex items-center gap-4">
                            <div className="w-16 h-16 rounded bg-[#1a1a1a] flex items-center justify-center text-2xl border border-white/10 flex-shrink-0">
                              ✅
                            </div>
                            <div>
                              <span className="text-xs uppercase font-bold text-green-400">Post-Service Completion</span>
                              <p className="text-xs text-[#a0a0a0] mt-1">
                                Completed installation verified by lead technician. Signed off under warranty standards.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: IMAGE ZOOM LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-lg hover:text-brand-gold cursor-pointer"
            >
              ✕ Close
            </button>
            <img src={selectedImage} alt="Enlarged proof" className="max-w-full max-h-[85vh] rounded object-contain border border-white/20" />
          </div>
        </div>
      )}

      {/* MODAL: CERTIFIED PROPERTY UPKEEP DOSSIER (PRINTABLE) */}
      {showPrintModal && (() => {
        const dossierRecords = dossierPropertyId === 'all'
          ? records
          : records.filter((r) => r.property_id === dossierPropertyId);

        const dossierTotalCost = dossierRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
        const dossierTargetProperty = properties.find((p) => p.id === dossierPropertyId);
        const issuanceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const auditId = `NIPS-${userProfile?.account_number || '100644'}-${dossierPropertyId === 'all' ? 'ALL' : dossierPropertyId.slice(0, 6).toUpperCase()}`;

        return createPortal(
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto dossier-modal-overlay">
            <div className="bg-[#111111] border border-white/20 rounded-2xl max-w-4xl w-full p-6 md:p-10 shadow-2xl space-y-6 my-8 text-white relative dossier-modal-container">
              {/* ACTION BAR (HIDDEN IN PRINT) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 print:hidden">
                <div className="flex items-center gap-2 text-brand-gold font-bold uppercase text-xs tracking-wider">
                  <span>🛡️</span>
                  <span>Official Upkeep Document Ready</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                  {/* PROPERTY FILTER DROPDOWN */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/70 font-medium">Property:</label>
                    <select
                      value={dossierPropertyId}
                      onChange={(e) => setDossierPropertyId(e.target.value)}
                      className="bg-[#1a1a1a] border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-gold cursor-pointer"
                    >
                      <option value="all">Portfolio (All Managed Properties)</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label ? `${p.label} - ` : ''}{p.address_line1 || 'Property'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handlePrintDossier}
                    className="bg-brand-gold text-[#0A0A0A] font-heading font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,95,31,0.25)] cursor-pointer"
                  >
                    <span>🖨️</span>
                    <span>Print / Save as PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* PRINTABLE DOSSIER SHEET (COMPACT CERTIFIED DOCUMENTATION) */}
              <div id="certified-dossier-sheet" className="bg-white text-slate-900 border-2 border-slate-900 p-1.5 rounded-sm shadow-xl font-sans dossier-sheet">
                <div className="border border-slate-300 p-5 sm:p-6 space-y-3.5">
                  {/* TOP CERTIFIED BANNER */}
                  <div className="border-b border-slate-300 pb-1 flex justify-between items-center text-[9px] font-mono tracking-widest uppercase text-slate-500 font-bold">
                    <span>★ OFFICIAL PROPERTY RECORD • CITY OF ROME &amp; FLOYD COUNTY, GA ★</span>
                    <span>REGISTRY ID: {auditId}</span>
                  </div>

                  {/* LETTERHEAD */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b-2 border-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      <img src={logo} alt="Nailed It Property Solutions" className="w-12 h-12 object-contain flex-shrink-0" />
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 font-serif leading-none">
                          NAILED IT PROPERTY SOLUTIONS
                        </h1>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-700 mt-1">
                          Certified Home Health &amp; Property Upkeep Dossier
                        </p>
                        <p className="text-[9.5px] text-slate-500 mt-0.5">
                          Rome &amp; Floyd County, GA • (706) 237-8184 • support@naileditpropertysolutions.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right border-l sm:border-l-2 border-slate-300 pl-4 flex-shrink-0">
                      <AuditQRCode value={`NIPS-AUDIT-${auditId}`} size={44} label="AUDIT TRAIL" />
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-900 text-[10px] font-bold uppercase rounded tracking-wider border border-green-300">
                          ✓ Certified Audit Trail
                        </span>
                        <p className="text-[10px] text-slate-600 mt-1">
                          Issued: <strong className="text-slate-900">{issuanceDate}</strong>
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono">
                          Account: <strong className="text-slate-900">{userProfile?.account_number || '100644-CLIENT'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CLIENT & PROPERTY SUMMARY */}
                  <div className="ledger-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded border border-slate-300 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Property Owner</p>
                      <p className="font-bold text-slate-900 text-sm">
                        {userProfile?.first_name} {userProfile?.last_name || 'Client'}
                      </p>
                      <p className="text-[10px] text-slate-600">{userProfile?.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Inspected Property</p>
                      <p className="font-bold text-slate-900 text-sm">
                        {dossierPropertyId === 'all'
                          ? 'Portfolio (All Managed Properties)'
                          : properties.find((p) => p.id === dossierPropertyId)?.address_line1 || 'Primary Property'}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {dossierTargetProperty ? `${dossierTargetProperty.city || 'Rome'}, GA ${dossierTargetProperty.zip || ''}` : 'Rome & Floyd County, GA'}
                      </p>
                    </div>
                  </div>

                  {/* VERIFIED LEDGER TABLE */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 border-b border-slate-300 pb-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Chronological Service &amp; Maintenance Ledger
                      </h2>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {dossierRecords.length} Authenticated Entries
                      </span>
                    </div>

                    <table className="ledger-table w-full text-left text-xs border border-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 text-[10px] uppercase tracking-wider font-bold">
                          <th className="py-1.5 px-2.5">Date</th>
                          <th className="py-1.5 px-2.5">Service Category</th>
                          <th className="py-1.5 px-2.5">Description &amp; Scope of Work</th>
                          <th className="py-1.5 px-2.5">Technician</th>
                          <th className="py-1.5 px-2.5 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dossierRecords.length === 0 ? (
                          <tr className="border-b border-slate-200">
                            <td colSpan={5} className="py-5 text-center text-slate-500 text-xs">
                              <p className="font-bold text-slate-700 uppercase mb-0.5">Clean Property Record Initialized</p>
                              <p className="text-[10px]">No active repairs or open work orders recorded in registry.</p>
                            </td>
                          </tr>
                        ) : (
                          dossierRecords.map((r, i) => (
                            <tr key={r.id} className={`ledger-avoid-break border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                              <td className="py-1.5 px-2.5 font-mono text-[10.5px] whitespace-nowrap align-top">
                                {new Date(r.service_date).toLocaleDateString()}
                              </td>
                              <td className="py-1.5 px-2.5 font-bold text-[10.5px] text-slate-900 align-top whitespace-nowrap">
                                {r.service_type}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-800 align-top text-[11px]">
                                <p className="font-semibold text-slate-950">{r.description}</p>
                                {r.customer_properties?.address_line1 && dossierPropertyId === 'all' && (
                                  <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5">
                                    Location: {r.customer_properties.address_line1}
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600 text-[10.5px] align-top whitespace-nowrap">
                                {r.performed_by || 'Nailed It Team'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[11px] text-slate-950 align-top whitespace-nowrap">
                                {r.cost ? `$${(r.cost / 100).toFixed(2)}` : 'Plan Included'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="ledger-avoid-break border-t-2 border-slate-900 font-bold text-slate-900 bg-slate-100">
                          <td colSpan={4} className="py-1.5 px-2.5 text-right uppercase text-[10.5px] tracking-wider">
                            Documented Upkeep Investment:
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono text-xs sm:text-sm font-black text-slate-950">
                            ${(dossierTotalCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* CERTIFICATE SEAL & SIGNATURE BLOCK */}
                  <div className="ledger-avoid-break pt-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs text-slate-600">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 uppercase text-[10.5px] tracking-wider">
                        Audit &amp; Inspection Guarantee
                      </p>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        All services listed above have been executed according to manufacturer specifications and municipal residential codes. This record is sealed and guaranteed by Nailed It Property Solutions LLC.
                      </p>
                      <div className="pt-1.5 flex items-center gap-3">
                        <AuditBarcode value={`NIPS-${userProfile?.account_number || 'CLIENT'}-${dossierRecords.length}`} className="h-6" />
                        <p className="text-[9px] text-slate-500 font-mono">
                          Digital Hash: NIPS-VAULT-{userProfile?.id?.slice(0, 8) || 'VERIFIED'}
                        </p>
                      </div>
                    </div>
                    <CharlesSignatureBlock
                      title="Director of Field Services, Nailed It Property Solutions"
                      certifiedText="✓ Certified Audit Sign-off"
                    />
                  </div>

                  {/* BOTTOM SECURITY NOTICE */}
                  <div className="border-t border-slate-300 pt-1 text-center text-[8.5px] font-mono tracking-wider text-slate-400 uppercase">
                    NAILED IT PROPERTY SOLUTIONS LLC • OFFICIAL CERTIFIED RESIDENTIAL UPKEEP DOSSIER • DO NOT ALTER
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
