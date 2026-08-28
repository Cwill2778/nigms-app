import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';

function Services() {
  useScrollToTop();
  usePageMeta(
    'Property Maintenance & Repair Services | Nailed It Property Solutions',
    'Comprehensive property solutions in Rome, GA. We offer residential repairs, appliance diagnostics, and 24/7 emergency maintenance.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          Our Services
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
        <p className="text-xl text-text-sub leading-relaxed max-w-3xl mx-auto mb-16">
          Whether you need a quick fix, a major repair, or proactive maintenance, we've got you covered. Select a service category below to learn more about how we can help protect your investment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Residential Repairs */}
          <Link to="/services/residential-repairs" className="bg-wood-800 border border-border-subtle p-8 rounded-xl shadow-xl hover:border-brand-orange/50 transition-all hover:-translate-y-1 group text-left flex flex-col">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">🏠</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4 group-hover:text-brand-orange transition-colors">Residential Repairs</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">From drywall and fixtures to decks and doors. If it's part of your home, we can fix it, upgrade it, or replace it.</p>
            <span className="text-brand-orange font-bold uppercase tracking-wider text-sm border-b border-transparent group-hover:border-brand-hover inline-block w-max mt-auto">
              View Details &rarr;
            </span>
          </Link>

          {/* Appliance Repairs */}
          <Link to="/services/appliance-repair" className="bg-wood-800 border border-border-subtle p-8 rounded-xl shadow-xl hover:border-brand-orange/50 transition-all hover:-translate-y-1 group text-left flex flex-col">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">❄️</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4 group-hover:text-brand-orange transition-colors">Appliance Repairs</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">Ovens, refrigerators, washers, and dryers. We diagnose and repair the essential appliances that keep your household running.</p>
            <span className="text-brand-orange font-bold uppercase tracking-wider text-sm border-b border-transparent group-hover:border-brand-hover inline-block w-max mt-auto">
              View Details &rarr;
            </span>
          </Link>

          {/* Emergency Services */}
          <Link to="/services/emergency-maintenance" className="bg-wood-800 border-b-4 border-b-brand-orange border-t border-x border-border-subtle p-8 rounded-xl shadow-xl hover:border-brand-orange/50 transition-all hover:-translate-y-1 group text-left flex flex-col">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">🚨</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4 group-hover:text-brand-orange transition-colors">Emergency Services</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">Property issues don't stick to business hours. When things go wrong unexpectedly, we provide fast, dependable emergency fixes.</p>
            <span className="text-brand-orange font-bold uppercase tracking-wider text-sm border-b border-transparent group-hover:border-brand-hover inline-block w-max mt-auto">
              View Details &rarr;
            </span>
          </Link>
        </div>

        <div className="mt-20 bg-wood-card border-2 border-brand-orange p-10 rounded-xl shadow-[0_0_30px_rgba(255,95,31,0.15)] flex flex-col md:flex-row items-center justify-between text-left gap-8">
          <div>
            <h3 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-3">Looking for Ongoing Maintenance?</h3>
            <p className="text-lg text-text-sub">Stop chasing repairs. Explore our flat-rate monthly subscriptions to put your property care on autopilot.</p>
          </div>
          <Link to="/maintenance-plans" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)] flex-shrink-0 text-center w-full md:w-auto">
            Explore Plans
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Services;
