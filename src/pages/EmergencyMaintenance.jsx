import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';

function EmergencyMaintenance() {
  useScrollToTop();
  usePageMeta(
    '24/7 Emergency Property Maintenance | Rome, GA',
    'Urgent property issue? Nailed It Property Solutions provides rapid emergency repairs for leaks, security risks, and critical failures in Rome, GA.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          Rapid Response When Things Go Wrong
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
        <div className="bg-wood-card border-2 border-brand-orange p-8 md:p-12 rounded-xl shadow-[0_10px_30px_rgba(255,95,31,0.15)] text-left relative mb-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-wood-900 font-bold uppercase tracking-wider px-6 py-1.5 rounded-full text-sm shadow-md animate-pulse">Available 24/7</div>
          <p className="text-xl text-text-sub leading-relaxed mb-6 mt-4">
            Property disasters don’t respect business hours. When a pipe bursts in the middle of the night or a storm compromises your property's exterior, you need a local team that answers the call.
          </p>
          <p className="text-xl text-text-sub leading-relaxed mb-10 border-l-4 border-brand-orange pl-6 font-bold">
            We prioritize emergency dispatch to mitigate damage and secure your home as quickly as possible.
          </p>
          
          <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 border-b border-border-subtle pb-4 flex items-center">
            <span className="text-3xl mr-3">🚨</span> Call Us Immediately For:
          </h2>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <li className="flex items-start bg-wood-800 p-4 rounded border border-border-subtle">
              <span className="text-brand-orange text-2xl mr-4 mt-0.5">⚠️</span>
              <div className="text-text-main text-lg pt-1">Active plumbing leaks or burst pipes.</div>
            </li>
            <li className="flex items-start bg-wood-800 p-4 rounded border border-border-subtle">
              <span className="text-brand-orange text-2xl mr-4 mt-0.5">⚠️</span>
              <div className="text-text-main text-lg pt-1">Critical appliance failures (e.g., a broken refrigerator full of groceries).</div>
            </li>
            <li className="flex items-start bg-wood-800 p-4 rounded border border-border-subtle">
              <span className="text-brand-orange text-2xl mr-4 mt-0.5">⚠️</span>
              <div className="text-text-main text-lg pt-1">Compromised exterior doors, windows, or locks.</div>
            </li>
            <li className="flex items-start bg-wood-800 p-4 rounded border border-border-subtle">
              <span className="text-brand-orange text-2xl mr-4 mt-0.5">⚠️</span>
              <div className="text-text-main text-lg pt-1">Immediate safety or structural hazards.</div>
            </li>
          </ul>

          <div className="text-center">
            <a href="tel:7062378184" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-10 py-6 rounded-md transition-all text-2xl shadow-[0_0_20px_rgba(255,95,31,0.5)] hover:shadow-[0_0_30px_rgba(255,95,31,0.7)] hover:-translate-y-1 inline-block">
              📞 706.237.8184
            </a>
            <p className="mt-4 text-text-sub uppercase tracking-widest text-sm font-bold">Tap to call our emergency line instantly</p>
          </div>
        </div>

        {/* Trust Badges */}
        <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-10 text-center">
          Why Rome Trusts Us In An Emergency
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-wood-800/80 border border-border-subtle p-6 rounded-lg text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🛡️</span>
            <strong className="text-text-main uppercase font-heading tracking-wide mb-1">Fully Insured</strong>
            <p className="text-sm text-text-sub">Protecting you and your property.</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-6 rounded-lg text-center flex flex-col items-center">
            <span className="text-4xl mb-3">⏱️</span>
            <strong className="text-text-main uppercase font-heading tracking-wide mb-1">2-Hour Arrival</strong>
            <p className="text-sm text-text-sub">Guaranteed on emergency dispatch.</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-6 rounded-lg text-center flex flex-col items-center">
            <span className="text-4xl mb-3">📱</span>
            <strong className="text-text-main uppercase font-heading tracking-wide mb-1">30-Min Text</strong>
            <p className="text-sm text-text-sub">We text you before we pull up.</p>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-6 rounded-lg text-center flex flex-col items-center">
            <span className="text-4xl mb-3">🟢</span>
            <strong className="text-text-main uppercase font-heading tracking-wide mb-1">Open 24/7</strong>
            <p className="text-sm text-text-sub">We answer the phone when it matters.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EmergencyMaintenance;

