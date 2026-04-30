'use client';

import { useState } from 'react';
import AssetMaterialManagement from '@/components/AssetMaterialManagement';
import type { WorkOrder } from '@/lib/types';

interface AssetMaterialManagementSectionProps {
  workOrders: (WorkOrder & { client_name?: string | null })[];
}

/**
 * AssetMaterialManagementSection — wraps AssetMaterialManagement with a
 * work order selector so the admin can pick which work order to log materials for.
 */
export default function AssetMaterialManagementSection({
  workOrders,
}: AssetMaterialManagementSectionProps) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');

  const activeWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'cancelled'
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Work Order Selector */}
      <div>
        <label
          htmlFor="asset-wo-select"
          style={{
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #6B6560)',
            marginBottom: '0.4rem',
            fontFamily: 'var(--font-heading, Montserrat), sans-serif',
          }}
        >
          Select Work Order
        </label>
        <select
          id="asset-wo-select"
          value={selectedWorkOrderId}
          onChange={(e) => setSelectedWorkOrderId(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            background: 'var(--color-bg-elevated, #222120)',
            border: '1px solid var(--color-steel-dim, #38352F)',
            borderRadius: '3px',
            color: 'var(--color-text-primary, #F2EDE8)',
            outline: 'none',
          }}
        >
          <option value="">— Choose a work order —</option>
          {activeWorkOrders.map((wo) => (
            <option key={wo.id} value={wo.id}>
              {wo.wo_number ? `${wo.wo_number} — ` : ''}
              {wo.title}
              {wo.client_name ? ` (${wo.client_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Material Management Panel */}
      {selectedWorkOrderId ? (
        <AssetMaterialManagement workOrderId={selectedWorkOrderId} />
      ) : (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted, #6B6560)',
            fontStyle: 'italic',
          }}
        >
          Select a work order above to log materials and view the materials list.
        </p>
      )}
    </div>
  );
}
