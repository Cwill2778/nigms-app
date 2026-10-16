import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AuditBarcode, AuditQRCode } from './AuditBarcode';

const STAGES = [
  { key: 'submitted', label: 'Submitted', color: '#ff8a00', icon: '📝' },
  { key: 'scheduled', label: 'Scheduled', color: '#2196f3', icon: '📅' },
  { key: 'in_progress', label: 'In Progress', color: '#9c27b0', icon: '⚙️' },
  { key: 'completed', label: 'Completed', color: '#4caf50', icon: '✅' },
];

export function MaintenanceTracker({ workOrders = [], submissions = [], userId, onRefresh }) {
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'list'
  const [approvingId, setApprovingId] = useState(null);

  // Keep a stable ref to onRefresh so the Realtime useEffect doesn't need
  // it in the dep array (which would tear down + resubscribe every render).
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  // Supabase Realtime Listener for instant job updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`client-work-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            toast.info(`Work Order "${payload.new.title}" was updated!`, {
              description: `Status is now: ${payload.new.status?.toUpperCase() ?? 'UPDATED'}`,
            });
          }
          onRefreshRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // ← only userId; onRefresh is accessed via ref

  // Filter orders by urgency
  const filteredOrders = workOrders.filter((wo) => {
    if (filterUrgency === 'all') return true;
    if (filterUrgency === 'emergency') return wo.priority === 'emergency';
    if (filterUrgency === 'urgent') return wo.priority === 'urgent' || wo.priority === 'important';
    if (filterUrgency === 'routine') return wo.priority === 'routine';
    if (filterUrgency === 'preventative') return wo.source === 'preventative_schedule';
    return true;
  });

  // Items pending client approval
  const pendingApprovals = [
    ...workOrders.filter((wo) => wo.status === 'pending_approval' || (wo.estimated_cost && !wo.approved && wo.status === 'scheduled')),
    ...submissions.filter((s) => s.status === 'countered'),
  ];

  async function handleApproveWorkOrder(id) {
    setApprovingId(id);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'scheduled', technician_notes: 'Client approved quote digitally.' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Quote approved! Our team will dispatch as scheduled.');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to approve quote.');
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl text-white font-heading font-bold uppercase tracking-wider flex items-center gap-3">
            <span>Command Center</span>
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-900/30 text-green-400 border border-green-700/50 rounded-full font-mono font-normal">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Live Realtime
            </span>
          </h2>
          <p className="text-sm text-[#a0a0a0] mt-1">
            Real-time tracking of active maintenance operations and dispatch requests.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* URGENCY FILTERS */}
          <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-white/10 text-xs">
            {['all', 'emergency', 'urgent', 'routine', 'preventative'].map((u) => (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                className={`px-3 py-1.5 rounded-md font-heading font-bold uppercase tracking-wider transition-colors ${
                  filterUrgency === u
                    ? u === 'emergency'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-brand-gold text-[#0A0A0A]'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-md font-heading font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'pipeline' ? 'bg-brand-gold text-[#0A0A0A]' : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-heading font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'list' ? 'bg-brand-gold text-[#0A0A0A]' : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* APPROVAL PORTAL BANNER */}
      {pendingApprovals.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-[#1a1405] to-amber-950/40 border border-brand-gold/60 p-6 rounded-xl shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand-gold/20 border border-brand-gold flex items-center justify-center text-2xl flex-shrink-0">
              ✍️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-heading font-bold text-brand-gold uppercase tracking-wider mb-1">
                Approvals Required ({pendingApprovals.length})
              </h3>
              <p className="text-sm text-[#a0a0a0] mb-4">
                The following out-of-scope work or quote proposals require your digital approval before our technicians can begin:
              </p>
              <div className="space-y-3">
                {pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0A0A0A] p-4 rounded-lg border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base">{item.title || 'Quote Proposal'}</span>
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-brand-gold border border-brand-gold/30 rounded uppercase font-bold">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-[#a0a0a0] line-clamp-1">{item.description}</p>
                      {item.counter_price && (
                        <p className="text-sm text-brand-gold font-bold mt-1">
                          Proposed Price: ${(item.counter_price / 100).toFixed(2)}
                        </p>
                      )}
                      {item.estimated_cost && (
                        <p className="text-sm text-brand-gold font-bold mt-1">
                          Estimated Cost: ${(item.estimated_cost / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApproveWorkOrder(item.id)}
                        disabled={approvingId === item.id}
                        className="bg-brand-gold text-[#0A0A0A] hover:opacity-90 font-heading font-bold uppercase tracking-wider px-5 py-2 rounded text-xs transition-transform hover:scale-105 shadow-md disabled:opacity-50"
                      >
                        {approvingId === item.id ? 'Approving...' : 'Sign & Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE KANBAN VIEW */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter((wo) => {
              if (stage.key === 'submitted') return wo.status === 'pending' || wo.status === 'new' || wo.status === 'submitted' || wo.status === 'pending_approval';
              if (stage.key === 'scheduled') return wo.status === 'scheduled';
              if (stage.key === 'in_progress') return wo.status === 'in_progress';
              if (stage.key === 'completed') return wo.status === 'completed';
              return false;
            });

            return (
              <div key={stage.key} className="bg-[#0A0A0A] rounded-xl border border-white/10 p-4 flex flex-col min-h-[420px]">
                {/* STAGE HEADER */}
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                      {stage.label}
                    </h3>
                  </div>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                    style={{ background: `${stage.color}25`, color: stage.color, border: `1px solid ${stage.color}50` }}
                  >
                    {stageOrders.length}
                  </span>
                </div>

                {/* STAGE ORDERS */}
                <div className="space-y-4 flex-1 overflow-y-auto">
                  {stageOrders.length === 0 ? (
                    <div className="h-40 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-[#555] text-xs">
                      No jobs in {stage.label.toLowerCase()}
                    </div>
                  ) : (
                    stageOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className="bg-[#111111] p-4 rounded-lg border border-white/10 hover:border-brand-gold/40 transition-all shadow-md group"
                        style={{ borderLeft: `3px solid ${wo.priority === 'emergency' ? '#f44336' : stage.color}` }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              wo.priority === 'emergency'
                                ? 'bg-red-900/50 text-red-400 border border-red-700 animate-pulse'
                                : 'bg-[#222] text-[#a0a0a0] border border-white/5'
                            }`}
                          >
                            {wo.priority}
                          </span>
                          <span className="text-[11px] text-[#666] font-mono">
                            {new Date(wo.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-brand-gold transition-colors">
                          {wo.title}
                        </h4>

                        <p className="text-xs text-[#a0a0a0] line-clamp-2 mb-3">
                          {wo.description}
                        </p>

                        {/* DISPATCH / TECH BADGE */}
                        <div className="pt-3 border-t border-white/5 flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between text-[#a0a0a0]">
                            <span>Tech:</span>
                            <span className="text-brand-gold font-medium">
                              {wo.assigned_technician ? `👷 ${wo.assigned_technician}` : 'Pending Dispatch'}
                            </span>
                          </div>
                          {wo.scheduled_date && (
                            <div className="flex items-center justify-between text-[#a0a0a0]">
                              <span>Date:</span>
                              <span className="text-white">
                                {new Date(wo.scheduled_date).toLocaleDateString()} {wo.scheduled_time && `@ ${wo.scheduled_time}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {wo.technician_notes && (
                          <div className="mt-3 p-2 bg-[#0A0A0A] rounded text-[11px] text-[#ccc] border border-white/5">
                            <span className="text-brand-gold font-bold mr-1">Note:</span>
                            {wo.technician_notes}
                          </div>
                        )}

                        {/* WORK ORDER AUDIT BARCODE */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#888]">
                            WO #{wo.id.slice(0, 8).toUpperCase()}
                          </span>
                          <AuditBarcode value={`WO-${wo.id.slice(0, 8).toUpperCase()}`} dark className="h-4" showText={false} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center text-[#a0a0a0]">
              No active work orders match your current filter.
            </div>
          ) : (
            filteredOrders.map((wo) => (
              <div
                key={wo.id}
                className="bg-[#111111] border border-white/10 rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{wo.title}</h3>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                        wo.priority === 'emergency'
                          ? 'bg-red-900/50 text-red-400 border border-red-700'
                          : 'bg-[#222] text-[#a0a0a0]'
                      }`}
                    >
                      {wo.priority}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/30 uppercase font-bold">
                      {wo.status?.replace('_', ' ') ?? 'unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-[#a0a0a0] mb-3">{wo.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#888]">
                    {wo.properties?.address_line_1 && <span>📍 {wo.properties.address_line_1}</span>}
                    <span>👷 Tech: <strong className="text-white">{wo.assigned_technician || 'Not assigned'}</strong></span>
                    {wo.scheduled_date && (
                      <span>📅 Scheduled: <strong className="text-white">{new Date(wo.scheduled_date).toLocaleDateString()} {wo.scheduled_time || ''}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-[#888] block uppercase">AUDIT VERIFICATION</span>
                    <span className="text-xs font-mono font-bold text-brand-gold">WO-NIPS-{wo.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <AuditQRCode value={`WO-NIPS-${wo.id}`} size={46} label="VERIFY" dark />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MaintenanceTracker;