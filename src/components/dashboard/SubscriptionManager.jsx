import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const TIERS_DATA = [
  {
    id: 'essential',
    name: 'Essential Care',
    price: 99,
    description: 'Bi-annual preventative maintenance, baseline risk mitigation, and standard work order access.',
    hours: 0,
    response: '48 Hours',
    inspections: '2x / year (Bi-Annual)',
    repairDiscount: '5%',
    dispatchFee: 'Standard',
    features: [
      '2 Comprehensive Safety & Plumbing Audits per year',
      'Exterior moisture & baseline risk inspection',
      'Access to vetted craftsman network',
      '5% off all quoted out-of-scope work'
    ]
  },
  {
    id: 'proactive',
    name: 'Proactive Care',
    price: 199,
    popular: true,
    description: 'Quarterly maintenance, 2.0 included monthly labor hours, and priority dispatch.',
    hours: 2.0,
    response: '24 Hours Priority',
    inspections: '4x / year (Quarterly)',
    repairDiscount: '12%',
    dispatchFee: '50% Discounted',
    features: [
      '4 Seasonal Turnover visits per year',
      '2.0 hours of included routine labor every month',
      'Seasonal gutter clearing & water heater flush',
      'Priority 24-hour service response',
      '12% off all quoted repairs & improvements'
    ]
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive White-Glove',
    price: 399,
    description: 'Monthly hands-off upkeep, 5.0 included monthly labor hours, dedicated lead technician, and emergency dispatch.',
    hours: 5.0,
    response: '4 Hours Emergency',
    inspections: '12x / year (Monthly)',
    repairDiscount: '20%',
    dispatchFee: '100% Waived',
    features: [
      'Monthly on-site preventative tune-ups',
      '5.0 hours of included labor every month',
      'Guaranteed 4-hour emergency response window',
      '100% waived emergency dispatch fees',
      'Dedicated lead technician (e.g., Charles)',
      '20% off all quoted construction & repairs'
    ]
  }
];

const SEASONAL_CHECKLIST = {
  spring: {
    title: 'Spring Turnover Checklist',
    description: 'Post-winter thaw diagnostics, AC preparation, and moisture intrusion defenses.',
    items: [
      { id: 'sp1', label: 'AC Condenser Inspection & Coil Wash', details: 'Check refrigerant lines, clean outdoor fins, verify thermostat cycling.' },
      { id: 'sp2', label: 'Gutter & Downspout Debris Clearing', details: 'Flush downspouts, verify minimum 6ft diversion away from foundation.' },
      { id: 'sp3', label: 'Exterior Hose Bibs & Spigots Pressure Test', details: 'Check for interior pipe freeze fissures from winter frost.' },
      { id: 'sp4', label: 'Roof Shingle & Flashing Inspection', details: 'Visual binocular audit for wind lift, moss, or cracked valley flashing.' },
      { id: 'sp5', label: 'Window & Door Weatherstrip Seal Audit', details: 'Inspect perimeter caulking to maintain cooling efficiency.' }
    ]
  },
  summer: {
    title: 'Summer Shield Checklist',
    description: 'Heat resistance, attic ventilation, exterior woodwork preservation, and plumbing stability.',
    items: [
      { id: 'su1', label: 'Attic Ventilation & Insulation Check', details: 'Ensure soffit baffles are unobstructed and temperature exhaust functions.' },
      { id: 'su2', label: 'Deck & Porch Wood Rot & Seal Assessment', details: 'Inspect joists, ledger boards, and test stain water-beading.' },
      { id: 'su3', label: 'Ceiling Fan Direction Optimization', details: 'Verify counter-clockwise rotation for downdraft airflow.' },
      { id: 'su4', label: 'Irrigation & Drainage Grading Check', details: 'Ensure summer storms divert cleanly away from crawlspace and basement.' },
      { id: 'su5', label: 'Smoke & CO Detector Battery Refresh', details: 'Depress test buttons, vacuum sensor dust, verify expiration stamps.' }
    ]
  },
  fall: {
    title: 'Fall Weatherization Checklist',
    description: 'Heating readiness, freeze prevention, draft sealing, and chimney/flue safety.',
    items: [
      { id: 'fa1', label: 'Furnace & Heating System Multi-Point Tune-Up', details: 'Igniter check, burner inspection, blower wheel cleaning, filter swap.' },
      { id: 'fa2', label: 'Exterior Hose Spigot Winterization', details: 'Shut off interior isolation valves and drain residual pipe water.' },
      { id: 'fa3', label: 'Water Heater Sediment Flush', details: 'Drain tank sediment to restore heating element efficiency and tank life.' },
      { id: 'fa4', label: 'Chimney Flue & Fireplace Damper Inspection', details: 'Inspect damper seal, creosote levels, and exterior spark arrestor.' },
      { id: 'fa5', label: 'Crawlspace Vent Closure & Pipe Insulation', details: 'Ensure foundation vents are closed and exposed supply lines wrapped.' }
    ]
  },
  winter: {
    title: 'Winter Freeze Defense Checklist',
    description: 'Extreme freeze monitoring, emergency shutoff tagging, and indoor air health.',
    items: [
      { id: 'wi1', label: 'Main Water Shutoff Valve Verification', details: 'Exercise shutoff valve to ensure smooth closure during pipe emergency.' },
      { id: 'wi2', label: 'Attic Frost & Moisture Condensation Audit', details: 'Check underside of roof sheathing for warm-air bypass condensation.' },
      { id: 'wi3', label: 'Door Sweep & Threshold Draft Mitigation', details: 'Adjust exterior door sills to eliminate heat loss and insect entry.' },
      { id: 'wi4', label: 'Dryer Exhaust Vent Deep Clean', details: 'Clear lint buildup through exterior exhaust hood to prevent fire hazards.' },
      { id: 'wi5', label: 'Emergency Backup Heat & Generator Readiness', details: 'Test emergency breakers and verify portable power accessibility.' }
    ]
  }
};

export function SubscriptionManager({ subscriptions = [], properties = [], userId, onRefresh }) {
  const [activeSeason, setActiveSeason] = useState('spring');
  const [completedItems, setCompletedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`nips_checklist_${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [upgradingTier, setUpgradingTier] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');

  // Synchronize checklist state with localStorage
  const handleToggleCheck = (itemId) => {
    const nextState = { ...completedItems, [itemId]: !completedItems[itemId] };
    setCompletedItems(nextState);
    try {
      localStorage.setItem(`nips_checklist_${userId}`, JSON.stringify(nextState));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Find active subscription
  const primarySub = subscriptions.find((s) => s.status === 'active') || subscriptions[0];
  const currentTierId = primarySub?.tier_id || primarySub?.subscription_tiers?.id || 'essential';
  const currentTierObj = TIERS_DATA.find((t) => t.id === currentTierId) || TIERS_DATA[0];

  // Simulated Labor Hours Tracker
  // (In real production, this is aggregated from work_orders duration this month)
  const totalIncludedHours = currentTierObj.hours || 0;
  const usedHours = totalIncludedHours > 0 ? (totalIncludedHours * 0.4).toFixed(1) : 0;
  const remainingHours = Math.max(0, totalIncludedHours - usedHours).toFixed(1);
  const usagePercentage = totalIncludedHours > 0 ? Math.round((usedHours / totalIncludedHours) * 100) : 0;

  async function handlePlanAction(targetTier) {
    if (targetTier.id === currentTierId) {
      toast.info(`You are currently subscribed to the ${targetTier.name}.`);
      return;
    }

    setUpgradingTier(targetTier.id);
    try {
      if (primarySub?.id) {
        // Update subscription tier in database
        const { error } = await supabase
          .from('customer_subscriptions')
          .update({
            tier_id: targetTier.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', primarySub.id);

        if (error) throw error;
        toast.success(`Successfully switched to ${targetTier.name}!`);
        onRefresh();
      } else {
        // If customer doesn't have an active subscription record yet, create one for their primary property
        const propertyId = selectedPropertyId || properties[0]?.id;
        if (!propertyId) {
          toast.error('Please add a property before activating a subscription.');
          return;
        }

        const { error } = await supabase
          .from('customer_subscriptions')
          .insert({
            customer_id: userId,
            property_id: propertyId,
            tier_id: targetTier.id,
            status: 'active',
            current_period_start: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(`Successfully enrolled in ${targetTier.name}!`);
        onRefresh();
      }
    } catch (err) {
      console.error('Plan upgrade error:', err);
      toast.error(err.message || 'Failed to update subscription.');
    } finally {
      setUpgradingTier(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* SECTION 1: ACTIVE TIER & LABOR HOURS TRACKER */}
      <div className="bg-gradient-to-br from-[#161616] to-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold text-[#0A0A0A] font-heading">
                Current Plan
              </span>
              <span className="text-xs text-green-400 font-mono flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Active Membership
              </span>
            </div>
            <h2 className="text-3xl text-white font-heading font-bold uppercase tracking-wider">
              {currentTierObj.name}
            </h2>
            <p className="text-[#a0a0a0] text-sm mt-1 max-w-xl">
              {currentTierObj.description}
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-bold">Monthly Rate</p>
            <p className="text-4xl font-heading font-bold text-brand-gold">
              ${currentTierObj.price}
              <span className="text-sm font-normal text-[#a0a0a0]"> /mo</span>
            </p>
            <p className="text-xs text-white/50 mt-1">Renews automatically each month</p>
          </div>
        </div>

        {/* LABOR HOURS USAGE BAR */}
        <div className="mt-6 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div>
              <h3 className="text-sm uppercase tracking-wider font-bold text-white flex items-center gap-2">
                <span>⏱️</span>
                <span>Included Routine Maintenance Labor</span>
              </h3>
              <p className="text-xs text-[#a0a0a0]">
                {totalIncludedHours > 0
                  ? 'Hours allocated towards filter swaps, squeaky doors, caulk touchups, and micro-repairs.'
                  : 'Upgrade to Proactive or Comprehensive to unlock monthly included craftsman hours.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">
                {totalIncludedHours > 0 ? `${usedHours} of ${totalIncludedHours} hrs used` : '0 hrs included'}
              </span>
              {totalIncludedHours > 0 && (
                <span className="text-xs text-brand-gold block font-mono">
                  {remainingHours} hrs remaining this cycle
                </span>
              )}
            </div>
          </div>

          {/* PROGRESS METER */}
          <div className="w-full bg-[#0A0A0A] h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercentage > 85 ? 'bg-amber-500' : 'bg-brand-gold'
              }`}
              style={{ width: `${totalIncludedHours > 0 ? Math.min(usagePercentage, 100) : 0}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#a0a0a0] mt-2 font-mono">
            <span>Cycle resets in 14 days</span>
            <span>Unused hours rollover up to 60 days</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPARISON & UPGRADE MATRIX */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl text-white font-heading font-bold uppercase tracking-wider">
            Membership Tier Comparison
          </h3>
          <p className="text-sm text-[#a0a0a0] mt-1">
            Upgrade your level of property protection anytime. Changes take effect on your next billing date.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS_DATA.map((tier) => {
            const isCurrent = tier.id === currentTierId;
            return (
              <div
                key={tier.id}
                className={`bg-[#111111] rounded-xl p-6 flex flex-col justify-between transition-all relative ${
                  tier.popular
                    ? 'border-2 border-brand-gold shadow-[0_10px_30px_rgba(255,95,31,0.15)] md:-translate-y-2'
                    : 'border border-white/10 hover:border-white/20'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-gold text-[#0A0A0A] text-xs font-heading font-bold uppercase px-4 py-1 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-heading font-bold uppercase tracking-wider text-white">
                      {tier.name}
                    </h4>
                    <span className="text-2xl font-bold text-brand-gold">
                      ${tier.price}
                      <span className="text-xs text-[#a0a0a0] font-normal">/mo</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#a0a0a0] mb-6 min-h-[36px]">{tier.description}</p>

                  <div className="space-y-3 border-t border-b border-white/10 py-4 mb-6 text-xs text-[#a0a0a0]">
                    <div className="flex justify-between">
                      <span>Included Labor:</span>
                      <strong className="text-white">{tier.hours} hrs / month</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Window:</span>
                      <strong className="text-white">{tier.response}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Seasonal Turnovers:</span>
                      <strong className="text-white">{tier.inspections}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Repair Quote Discount:</span>
                      <strong className="text-brand-gold">{tier.repairDiscount} OFF</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Emergency Dispatch:</span>
                      <strong className="text-white">{tier.dispatchFee}</strong>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                        <span className="text-brand-gold font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent || upgradingTier === tier.id}
                  onClick={() => handlePlanAction(tier)}
                  className={`w-full py-3 rounded-lg font-heading font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                      : tier.popular
                      ? 'bg-brand-gold hover:opacity-90 text-[#0A0A0A] shadow-[0_0_15px_rgba(255,95,31,0.25)]'
                      : 'bg-[#1a1a1a] hover:bg-white/10 text-white border border-white/10 hover:border-brand-gold'
                  }`}
                >
                  {isCurrent ? 'Current Membership' : upgradingTier === tier.id ? 'Switching...' : `Select ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: 4-SEASON PREVENTATIVE MAINTENANCE CHECKLIST */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl text-white font-heading font-bold uppercase tracking-wider flex items-center gap-2">
              <span>🗓️</span>
              <span>4-Season Preventative Care Checklist</span>
            </h3>
            <p className="text-xs text-[#a0a0a0] mt-1">
              What Nailed It inspects and fortifies during each seasonal home turnover visit in Floyd County.
            </p>
          </div>

          {/* SEASON TABS */}
          <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-white/10">
            {['spring', 'summer', 'fall', 'winter'].map((season) => (
              <button
                key={season}
                onClick={() => setActiveSeason(season)}
                className={`px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeSeason === season
                    ? 'bg-brand-gold text-[#0A0A0A]'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE SEASON DETAILS */}
        <div>
          <div className="mb-4">
            <h4 className="text-lg font-bold text-white">{SEASONAL_CHECKLIST[activeSeason].title}</h4>
            <p className="text-xs text-[#a0a0a0]">{SEASONAL_CHECKLIST[activeSeason].description}</p>
          </div>

          <div className="space-y-3">
            {SEASONAL_CHECKLIST[activeSeason].items.map((item) => {
              const isChecked = Boolean(completedItems[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
                    isChecked
                      ? 'bg-green-950/20 border-green-800/40'
                      : 'bg-[#0A0A0A] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="mt-0.5">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-green-500 border-green-400 text-black font-black'
                          : 'border-white/30 bg-[#161616]'
                      }`}
                    >
                      {isChecked && '✓'}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <h5
                        className={`text-sm font-bold transition-colors ${
                          isChecked ? 'line-through text-white/50' : 'text-white'
                        }`}
                      >
                        {item.label}
                      </h5>
                      <span className="text-[11px] font-mono text-[#a0a0a0]">
                        {isChecked ? 'Completed & Verified' : 'Pending Turnover'}
                      </span>
                    </div>
                    <p className="text-xs text-[#a0a0a0] mt-1">{item.details}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#a0a0a0]">
              Need immediate assistance with one of these items?
            </span>
            <a
              href="/#name-your-price"
              className="bg-brand-gold/10 hover:bg-brand-gold hover:text-[#0A0A0A] text-brand-gold border border-brand-gold/30 text-xs font-heading font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
            >
              Request Custom Diagnostic
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
