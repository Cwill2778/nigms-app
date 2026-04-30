'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  work_order_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  receipt_url: string | null;
  created_at: string;
}

interface AssetMaterialManagementProps {
  workOrderId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── AssetMaterialManagement ──────────────────────────────────────────────────

/**
 * AssetMaterialManagement — Admin Asset & Material Management (Requirement 8.5)
 *
 * Per-work-order form to log materials (description, quantity, unit cost, supplier)
 * with receipt image upload to Supabase Storage. Displays materials list with
 * computed total cost.
 */
export default function AssetMaterialManagement({ workOrderId }: AssetMaterialManagementProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch materials ──────────────────────────────────────────────────────────

  async function fetchMaterials() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: true });

      if (fetchError) throw new Error(fetchError.message);
      setMaterials((data ?? []) as Material[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId]);

  // ── Upload receipt to Supabase Storage ──────────────────────────────────────

  async function uploadReceipt(file: File): Promise<string | null> {
    const supabase = createBrowserClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `receipts/${workOrderId}/${Date.now()}.${ext}`;

    setUploadProgress('Uploading receipt…');

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      throw new Error(`Receipt upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
    setUploadProgress(null);
    return urlData?.publicUrl ?? null;
  }

  // ── Submit new material ──────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const qty = parseFloat(quantity);
    const cost = parseFloat(unitCost);

    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError('Unit cost must be a non-negative number.');
      return;
    }

    setSubmitting(true);

    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile);
      }

      const res = await fetch(`/api/admin/work-orders/${workOrderId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          quantity: qty,
          unit_cost: cost,
          supplier: supplier.trim() || undefined,
          receipt_url: receiptUrl ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const newMaterial = (await res.json()) as Material;
      setMaterials((prev) => [...prev, newMaterial]);

      // Reset form
      setDescription('');
      setQuantity('');
      setUnitCost('');
      setSupplier('');
      setReceiptFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add material.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  // ── Computed total ───────────────────────────────────────────────────────────

  const totalCost = materials.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--color-bg-elevated, #222120)',
    border: '1px solid var(--color-steel-dim, #38352F)',
    borderRadius: '3px',
    color: 'var(--color-text-primary, #F2EDE8)',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted, #6B6560)',
    marginBottom: '0.35rem',
    fontFamily: 'var(--font-heading, Montserrat), sans-serif',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Add Material Form ── */}
      <div
        style={{
          background: 'var(--color-bg-elevated, #222120)',
          border: '1px solid var(--color-steel-dim, #38352F)',
          borderRadius: '4px',
          padding: '1.25rem 1.5rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #6B6560)',
            fontFamily: 'var(--font-heading, Montserrat), sans-serif',
            marginBottom: '1rem',
          }}
        >
          Log Material
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Description */}
          <div>
            <label style={labelStyle} htmlFor={`mat-desc-${workOrderId}`}>
              Description *
            </label>
            <input
              id={`mat-desc-${workOrderId}`}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2×4 lumber, PVC pipe, paint…"
              style={inputStyle}
              disabled={submitting}
              required
            />
          </div>

          {/* Quantity + Unit Cost row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle} htmlFor={`mat-qty-${workOrderId}`}>
                Quantity *
              </label>
              <input
                id={`mat-qty-${workOrderId}`}
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                style={inputStyle}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor={`mat-cost-${workOrderId}`}>
                Unit Cost ($) *
              </label>
              <input
                id={`mat-cost-${workOrderId}`}
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label style={labelStyle} htmlFor={`mat-supplier-${workOrderId}`}>
              Supplier (optional)
            </label>
            <input
              id={`mat-supplier-${workOrderId}`}
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Home Depot, Lowe's…"
              style={inputStyle}
              disabled={submitting}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label style={labelStyle} htmlFor={`mat-receipt-${workOrderId}`}>
              Receipt Image (optional)
            </label>
            <input
              id={`mat-receipt-${workOrderId}`}
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              disabled={submitting}
              style={{
                ...inputStyle,
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
              }}
            />
            {receiptFile && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted, #6B6560)',
                  marginTop: '0.25rem',
                }}
              >
                Selected: {receiptFile.name}
              </p>
            )}
            {uploadProgress && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-status-gold, #F59E0B)',
                  marginTop: '0.25rem',
                }}
              >
                {uploadProgress}
              </p>
            )}
          </div>

          {/* Form error */}
          {formError && (
            <div
              role="alert"
              style={{
                padding: '0.6rem 0.875rem',
                borderRadius: '3px',
                background: 'rgba(255,127,127,0.1)',
                border: '1px solid rgba(255,127,127,0.4)',
                color: 'var(--color-precision-coral, #FF7F7F)',
                fontSize: '0.8rem',
              }}
            >
              {formError}
            </div>
          )}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-heading, Montserrat), sans-serif',
                background: submitting
                  ? 'var(--color-steel-dim, #38352F)'
                  : 'var(--color-precision-coral, #FF7F7F)',
                color: submitting ? 'var(--color-text-muted, #6B6560)' : '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {submitting ? 'Adding…' : '+ Add Material'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Materials List ── */}
      <div>
        <h3
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #6B6560)',
            fontFamily: 'var(--font-heading, Montserrat), sans-serif',
            marginBottom: '0.75rem',
          }}
        >
          Materials Used
        </h3>

        {loading ? (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted, #6B6560)',
              fontStyle: 'italic',
            }}
          >
            Loading materials…
          </p>
        ) : error ? (
          <div
            className="alert alert-error"
            role="alert"
            style={{ padding: '0.75rem 1rem', borderRadius: '3px', fontSize: '0.875rem' }}
          >
            {error}
          </div>
        ) : materials.length === 0 ? (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted, #6B6560)',
              fontStyle: 'italic',
            }}
          >
            No materials logged yet.
          </p>
        ) : (
          <div
            className="card overflow-hidden"
            style={{ border: '1px solid var(--color-steel-dim, #38352F)' }}
          >
            <table className="table-industrial">
              <thead>
                <tr>
                  {['Description', 'Qty', 'Unit Cost', 'Total', 'Supplier', 'Receipt'].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td
                      style={{
                        color: 'var(--color-text-primary, #F2EDE8)',
                        fontWeight: 500,
                      }}
                    >
                      {mat.description}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                      {mat.quantity}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                      {formatCurrency(mat.unit_cost)}
                    </td>
                    <td
                      style={{
                        color: 'var(--color-text-primary, #F2EDE8)',
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(mat.total_cost)}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary, #C4BFB8)' }}>
                      {mat.supplier ?? '—'}
                    </td>
                    <td>
                      {mat.receipt_url ? (
                        <a
                          href={mat.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-precision-coral, #FF7F7F)',
                            textDecoration: 'underline',
                          }}
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted, #6B6560)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted, #6B6560)',
                      fontFamily: 'var(--font-heading, Montserrat), sans-serif',
                      textAlign: 'right',
                      borderTop: '1px solid var(--color-steel-dim, #38352F)',
                    }}
                  >
                    Total Cost
                  </td>
                  <td
                    colSpan={3}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--color-text-primary, #F2EDE8)',
                      fontFamily: 'var(--font-heading, Montserrat), sans-serif',
                      borderTop: '1px solid var(--color-steel-dim, #38352F)',
                    }}
                  >
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
