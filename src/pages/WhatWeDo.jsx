import usePageMeta from '../hooks/usePageMeta';

function WhatWeDo() {
  usePageMeta('What We Do | Nailed It Property Solutions', 'Learn about our comprehensive maintenance, repair, and documentation services.');

  return (
    <div className="w-full bg-[#0A0A0A] text-white min-h-[60vh] py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-brand-gold font-heading font-bold uppercase tracking-wide mb-6 text-center">What We Do</h1>
        <p className="text-center text-[#a0a0a0] font-body mb-16 max-w-3xl mx-auto text-lg">
          Nailed It Property Solutions provides a practical mix of preventative maintenance, repair, and emergency response services designed to help property owners protect the condition and value of their homes and investments.
        </p>
        
        <div className="space-y-12">
          
          <div className="bg-[#111111] border border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl"></div>
             <h2 className="text-2xl text-brand-gold font-heading font-bold mb-4 uppercase tracking-widest">Preventative Maintenance Subscriptions</h2>
             <p className="text-[#a0a0a0] font-body leading-relaxed mb-6">
               Recurring maintenance plans for homeowners and property investors that include scheduled inspections, small repairs, seasonal tasks, and priority service. These plans are designed to reduce breakdowns, catch issues early, and keep properties in better long-term condition.
             </p>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#d0d0d0]">
               <li>• Predictable recurring care</li>
               <li>• Prevents costly emergencies</li>
               <li>• Priority scheduling</li>
               <li>• Builds verified property history</li>
             </ul>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl"></div>
             <h2 className="text-2xl text-brand-gold font-heading font-bold mb-4 uppercase tracking-widest">Discounted Labor Blocks</h2>
             <p className="text-[#a0a0a0] font-body leading-relaxed mb-6">
               Pre-purchased labor hours that customers can use for small repairs, punch lists, and ongoing maintenance at a discounted rate, helping owners budget more predictably.
             </p>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl"></div>
             <h2 className="text-2xl text-brand-gold font-heading font-bold mb-4 uppercase tracking-widest">Verified Upkeep Records & Reporting</h2>
             <p className="text-[#a0a0a0] font-body leading-relaxed mb-6">
               Detailed service logs, maintenance histories, and condition documentation created from every completed job. These records help property owners demonstrate upkeep to buyers, tenants, lenders, insurers, and real estate professionals.
             </p>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#d0d0d0]">
               <li>• Condition reporting for sales & refinancing</li>
               <li>• Support for insurance claims</li>
               <li>• Investor due diligence packages</li>
               <li>• Complete photo documentation</li>
             </ul>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-lg p-8 shadow-2xl relative overflow-hidden">
             <h2 className="text-2xl text-brand-gold font-heading font-bold mb-4 uppercase tracking-widest">Additional & Specialized Services</h2>
             <p className="text-[#a0a0a0] font-body leading-relaxed mb-6">
               We offer a wide range of secondary services that support homeowners and landlords by making it easier to maintain and protect properties over time.
             </p>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#d0d0d0]">
               <li>• Seasonal Maintenance Tune-Ups</li>
               <li>• Move-In / Move-Out Inspections</li>
               <li>• Tenant-Friendly Repair Dispatch Support</li>
               <li>• Leak Detection & Water Damage Prevention</li>
               <li>• Fixture Replacements & Upgrades</li>
               <li>• Smart Home Device Installation</li>
             </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default WhatWeDo;
