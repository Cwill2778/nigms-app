import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';

function ApplianceRepair() {
  useScrollToTop();
  usePageMeta(
    'Local Appliance Repair Services | Rome, GA',
    'Fast and dependable appliance repair in Rome, GA. We fix refrigerators, ovens, washers, dryers, and more to keep your household running.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          Fast, Reliable Appliance Diagnostics and Repair
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
        <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl text-left mb-16">
          <p className="text-xl text-text-sub leading-relaxed mb-6">
            A broken appliance throws off your entire week. You don't have time to wait around for a technician who might not show up. We provide prompt, professional appliance repair to get your daily routine back on track.
          </p>
          <p className="text-xl text-text-sub leading-relaxed mb-10 border-l-4 border-brand-orange pl-6 italic">
            Our trusted independent professionals diagnose the issue quickly and provide clear, upfront solutions so you can decide the best course of action for your home.
          </p>
          
          <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 border-b border-border-subtle pb-4">Appliances We Service</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-wood-800 border-t-4 border-brand-orange p-6 rounded shadow-lg text-center">
              <div className="text-5xl mb-4">🍳</div>
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Kitchen</h3>
              <p className="text-text-sub">Refrigerators, freezers, ovens, ranges, and dishwashers.</p>
            </div>
            <div className="bg-wood-800 border-t-4 border-brand-orange p-6 rounded shadow-lg text-center">
              <div className="text-5xl mb-4">🧺</div>
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Laundry</h3>
              <p className="text-text-sub">Washing machines and dryers (including vent cleanings).</p>
            </div>
            <div className="bg-wood-800 border-t-4 border-brand-orange p-6 rounded shadow-lg text-center">
              <div className="text-5xl mb-4">🚰</div>
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Utility</h3>
              <p className="text-text-sub">Water heaters and garbage disposals.</p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/contact" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-10 py-5 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_25px_rgba(255,95,31,0.5)] hover:-translate-y-1 inline-block">
              Schedule an Appliance Diagnostic
            </Link>
          </div>
        </div>

        {/* Common Symptoms Grid */}
        <h2 className="text-3xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 text-center">
          Sound Familiar?
        </h2>
        <div className="h-1 w-16 bg-brand-orange mx-auto mb-10"></div>
        <p className="text-lg text-text-sub text-center mb-10 max-w-2xl mx-auto">If you are experiencing any of these common issues, don't wait for a total failure. Call us to diagnose the problem before it requires a full replacement.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Fridge not cooling</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Dryer not heating</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Washer leaking</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Oven won't ignite</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Dishwasher not draining</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Noisy spin cycle</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Ice maker broken</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-4 rounded text-center hover:border-brand-orange/50 transition-colors">
            <p className="text-text-main font-bold">Strange burning smells</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ApplianceRepair;
