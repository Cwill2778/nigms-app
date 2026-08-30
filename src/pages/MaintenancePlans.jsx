import { useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import TestimonialCarousel from '../components/TestimonialCarousel';

function FAQAccordion({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border-subtle rounded-lg bg-wood-800/50 overflow-hidden mb-4 transition-all">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-wood-800 focus:outline-none focus:ring-2 focus:ring-brand-orange"
      >
        <span className="text-text-main font-bold font-heading uppercase tracking-wide">{question}</span>
        <span className="text-brand-orange text-2xl">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-6 pb-4 pt-2 text-text-sub leading-relaxed border-t border-border-subtle bg-wood-800/20">
          {answer}
        </div>
      )}
    </div>
  );
}

import deckStain from '../assets/deckStainBeforeAndAfter.webp';

function MaintenancePlans() {
  useScrollToTop();
  usePageMeta(
    'Proactive Home Maintenance Subscriptions in Rome, GA',
    'Stop waiting for things to break. Explore our flat-rate home maintenance subscriptions designed to protect your property year-round.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      <section 
        className="relative px-4 py-32 md:py-48 text-center bg-cover bg-center bg-no-repeat mb-16 border-b-2 border-brand-orange shadow-[0_4px_20px_rgba(255,95,31,0.2)]"
        style={{ backgroundImage: `url(${deckStain})` }}
      >
        <div className="absolute inset-0 bg-wood-900/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 drop-shadow-lg">
            Stop Chasing Repairs. Start Protecting Your Property.
          </h1>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-8"></div>
          <p className="text-xl text-text-sub leading-relaxed max-w-4xl mx-auto drop-shadow-md">
            Routine maintenance is the secret to avoiding massive repair bills, but it’s the first thing that falls off a busy homeowner's to-do list. Our localized subscription tiers put your property care on autopilot.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">

        <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 text-center">Choose Your Level of Care</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Core */}
          <div className="bg-wood-800 border border-border-subtle p-8 rounded-lg shadow-lg flex flex-col h-full hover:border-brand-orange/50 transition-colors">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">Core Tier</h3>
                <span className="text-2xl font-bold text-brand-orange">$49<span className="text-sm text-text-sub font-normal">/mo</span></span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">The Annual Safety Audit</p>
              <p className="text-text-sub mb-6 leading-relaxed">Two visits a year focusing on baseline risk mitigation. We inspect plumbing, test safety devices, check your HVAC baseline, and perform an exterior integrity check.</p>
            </div>
          </div>
          
          {/* Advanced */}
          <div className="bg-wood-card border-2 border-brand-orange p-8 rounded-lg shadow-[0_10px_30px_rgba(255,95,31,0.15)] flex flex-col h-full relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-wood-900 font-bold uppercase tracking-wider px-6 py-1.5 rounded-full text-sm shadow-md">Most Popular</div>
            <div className="flex-1 mt-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">Advanced Tier</h3>
                <span className="text-2xl font-bold text-brand-orange">$129<span className="text-sm text-wood-400 font-normal">/mo</span></span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">Four Seasons Turnover</p>
              <p className="text-text-sub mb-6 leading-relaxed">Four visits a year with 5 included labor hours. Includes everything in the Core Tier, plus seasonal gutter clearing, fall weatherization, spring water heater flushing, and early-detection wood rot inspections.</p>
            </div>
            <div className="mt-auto pt-6 text-center">
              <Link to="/contact" className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors inline-block text-sm">
                Select Advanced
              </Link>
            </div>
          </div>
          
          {/* Premier */}
          <div className="bg-wood-800 border border-border-subtle p-8 rounded-lg shadow-lg flex flex-col h-full hover:border-brand-orange/50 transition-colors">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">Premier Tier</h3>
                <span className="text-2xl font-bold text-brand-orange">$199<span className="text-sm text-text-sub font-normal">/mo</span></span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">Monthly White-Glove Preventative</p>
              <p className="text-text-sub mb-6 leading-relaxed">The ultimate hands-off experience. A dedicated, familiar professional like Charles will be on-site every month to handle micro-maintenance. Includes 8 labor hours, hardware tune-ups, caulk/grout integrity checks, appliance efficiency cleanings, dryer vent clearing, plumbing deep-dives, and 25% off additional quoted repairs.</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-wood-card border-y border-border-subtle py-16 -mx-4 px-4 mb-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 text-center">
              Don't Just Take Our Word For It
            </h2>
            <div className="h-1 w-16 bg-brand-orange mx-auto mb-10"></div>
            <TestimonialCarousel />
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <FAQAccordion 
            question="What happens if I need an emergency repair?"
            answer="If you are an Advanced or Premier subscriber, you receive priority emergency dispatch. The repair labor will be deducted from your included monthly labor hours. If the repair exceeds your included hours, you'll be billed at our flat-rate with a 25% discount (Premier tier only)."
          />
          <FAQAccordion 
            question="Do unused labor hours roll over to the next month?"
            answer="Labor hours are designed for preventative maintenance and do not roll over. However, if your home is running perfectly, we use that time to handle micro-improvements or deep cleaning of your HVAC/appliance systems to ensure nothing breaks in the future."
          />
          <FAQAccordion 
            question="Are materials included in the monthly fee?"
            answer="No, the subscription fee covers our time, expertise, and all preventative labor. Any required parts, materials, or replacement fixtures will be quoted at-cost before installation."
          />
          <FAQAccordion 
            question="Can I cancel my subscription at any time?"
            answer="Yes, our subscriptions are month-to-month. We don't believe in locking our neighbors into long-term contracts. If you aren't seeing the value, you can cancel anytime with a 30-day notice."
          />
        </div>

        <div className="text-center">
          <Link to="/contact" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-12 py-6 rounded-md transition-all text-xl shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_25px_rgba(255,95,31,0.5)] hover:-translate-y-1 inline-block">
            Sign Up for a Maintenance Plan
          </Link>
        </div>
      </section>
    </div>
  );
}

export default MaintenancePlans;
