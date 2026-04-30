'use client';

/**
 * PropertyManagement — client dashboard section for managing properties.
 *
 * Features:
 * - Lists all properties with address and subscription status badge
 * - Inline address editing with Save/Cancel
 * - Add property form with duplicate-address inline error (409)
 * - Remove button with guard error for active subscription / open work orders
 *
 * Requirements: 7.12, 7.13, 7.14, 7.15, 7.16, 7.17, 7.18
 */

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertySubscription {
  id: string;
  tier: string;
  status: string;
}

interface PropertyWithSub {
  id: string;
  address: string;
  created_at: string;
  subscription: PropertySubscription | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SubscriptionBadge({ sub }: { sub: PropertySubscription | null }) {
  if (!sub) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.2rem 0.55rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          borderRadius: '2px',
          background: 'rgba(119,141,169,0.12)',
          color: '#778DA9',
          border: '1px solid rgba(119,141,169,0.35)',
        }}
      >
        No Subscription
      </span>
    );
  }

  const isActive = sub.status === 'active';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        borderRadius: '2px',
        background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(119,141,169,0.12)',
        color: isActive ? '#22C55E' : '#778DA9',
        border: isActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(119,141,169,0.35)',
      }}
    >
      {isActive ? `Active — ${sub.tier}` : sub.status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropertyManagement() {
  const [properties, setProperties] = useState<PropertyWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Add form state
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Edit state: maps property id → draft address
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Remove error state: maps property id → error message
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/client/properties');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFetchError((body as { error?: string }).error ?? 'Failed to load properties.');
        return;
      }
      const body = await res.json();
      setProperties((body as { properties: PropertyWithSub[] }).properties ?? []);
    } catch {
      setFetchError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  // ── Add property ──────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAddress.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/client/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress.trim() }),
      });
      if (res.status === 409) {
        setAddError('This property address is already associated with your account.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAddError((body as { error?: string }).error ?? 'Failed to add property.');
        return;
      }
      setNewAddress('');
      await fetchProperties();
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  // ── Edit property ─────────────────────────────────────────────────────────

  function startEdit(property: PropertyWithSub) {
    setEditingId(property.id);
    setEditAddress(property.address);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAddress('');
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editAddress.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/client/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: editAddress.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setEditError((body as { error?: string }).error ?? 'Failed to update address.');
        return;
      }
      setEditingId(null);
      await fetchProperties();
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Remove property ───────────────────────────────────────────────────────

  async function handleRemove(id: string) {
    setRemoving(id);
    setRemoveErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`/api/client/properties/${id}`, {
        method: 'DELETE',
      });
      if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        setRemoveErrors((prev) => ({
          ...prev,
          [id]: (body as { error?: string }).error ?? 'Cannot remove this property.',
        }));
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRemoveErrors((prev) => ({
          ...prev,
          [id]: (body as { error?: string }).error ?? 'Failed to remove property.',
        }));
        return;
      }
      await fetchProperties();
    } catch {
      setRemoveErrors((prev) => ({
        ...prev,
        [id]: 'Network error. Please try again.',
      }));
    } finally {
      setRemoving(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className="card"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-steel-dim)' }}
    >
      {/* Header */}
      <div className="card-header">
        <h3
          className="card-header-title"
          style={{ color: 'var(--color-steel-shine)', fontSize: '0.8rem' }}
        >
          Property Management
        </h3>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Loading / error states */}
        {loading && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Loading properties…
          </p>
        )}
        {fetchError && (
          <div className="alert alert-error" role="alert">
            {fetchError}
          </div>
        )}

        {/* Property list */}
        {!loading && properties.length === 0 && !fetchError && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No properties yet. Add one below.
          </p>
        )}

        {properties.map((property) => (
          <div
            key={property.id}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-steel-dim)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {/* Address row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Address / edit input */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === property.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <input
                      className="input"
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Enter new address"
                      aria-label="Edit property address"
                      style={{ fontSize: '0.9rem' }}
                    />
                    {editError && (
                      <p
                        role="alert"
                        style={{ color: 'var(--color-error)', fontSize: '0.8rem', margin: 0 }}
                      >
                        {editError}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.78rem' }}
                        onClick={() => void handleSaveEdit(property.id)}
                        disabled={saving || !editAddress.trim()}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.78rem' }}
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {property.address}
                  </p>
                )}
              </div>

              {/* Action buttons (only shown when not editing this row) */}
              {editingId !== property.id && (
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    onClick={() => startEdit(property)}
                    aria-label={`Edit address for ${property.address}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-ghost"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.3rem 0.65rem',
                      color: 'var(--color-error)',
                    }}
                    onClick={() => void handleRemove(property.id)}
                    disabled={removing === property.id}
                    aria-label={`Remove property ${property.address}`}
                  >
                    {removing === property.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              )}
            </div>

            {/* Subscription badge */}
            <div>
              <SubscriptionBadge sub={property.subscription} />
            </div>

            {/* Remove guard error */}
            {removeErrors[property.id] && (
              <div className="alert alert-error" role="alert" style={{ marginTop: '0.25rem' }}>
                {removeErrors[property.id]}
              </div>
            )}
          </div>
        ))}

        {/* Divider before add form */}
        {properties.length > 0 && <hr className="divider" style={{ margin: '0.25rem 0' }} />}

        {/* Add property form */}
        <form onSubmit={(e) => void handleAdd(e)} noValidate>
          <label
            htmlFor="new-property-address"
            className="label"
            style={{ marginBottom: '0.375rem' }}
          >
            Add a Property
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              id="new-property-address"
              className="input"
              type="text"
              value={newAddress}
              onChange={(e) => {
                setNewAddress(e.target.value);
                if (addError) setAddError(null);
              }}
              placeholder="123 Main St, City, State 00000"
              aria-label="New property address"
              aria-describedby={addError ? 'add-property-error' : undefined}
              style={{ flex: 1, minWidth: '200px' }}
              disabled={adding}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.85rem', flexShrink: 0 }}
              disabled={adding || !newAddress.trim()}
            >
              {adding ? 'Adding…' : 'Add Property'}
            </button>
          </div>

          {/* Inline duplicate-address error (Requirement 7.14) */}
          {addError && (
            <p
              id="add-property-error"
              role="alert"
              style={{
                color: 'var(--color-error)',
                fontSize: '0.8rem',
                marginTop: '0.375rem',
                marginBottom: 0,
              }}
            >
              {addError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
