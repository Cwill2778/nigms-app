import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import portrait from '../assets/charlesImg.jpg';

import TestimonialCarousel from '../components/TestimonialCarousel';

function Home() {
  useScrollReveal();
  usePageMeta(
    'Property Maintenance and Emergency Repairs Rome, GA | Nailed It Property Solutions',
    'Nailed It Property Solutions offers expert property maintenance, repairs, emergency calls, unit turnovers, and home repair services for homeowners and landlords in Rome, GA. Call today!'
  );

  return (
    <div className="w-full">
      {/* 1. The Hook (Hero Section) */}
      <section className="max-w-5xl mx-auto px-4 py-24 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 drop-shadow-lg leading-tight">
          Tired of Endless Searching for the Right Person to Fix What's Broken?
        </h1>
        <p className="text-xl md:text-2xl text-text-main font-body leading-relaxed mb-12 text-justify md:text-center max-w-4xl mx-auto drop-shadow-md">
          Finding a repairman shouldn't be this hard. We specialize in plumbing, finishing, appliances, sheetrock, siding, and more.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <a href="tel:7062378184" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_25px_rgba(255,95,31,0.5)] w-full sm:w-auto text-center text-lg">
            Request a Repair Now
          </a>
          <Link to="/maintenance-plans" className="border-2 border-brand-orange text-brand-orange hover:bg-brand-orange/10 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-colors w-full sm:w-auto text-center text-lg">
            Explore Maintenance Plans
          </Link>
        </div>
      </section>

      {/* 2. The Immediate Relief (Core Services) */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">One Call Fixes It All.</h2>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-text-sub max-w-3xl mx-auto leading-relaxed">
            You don’t need to juggle a plumber, a carpenter, and an appliance tech. We provide comprehensive, reliable repairs for your entire home.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-wood-800/80 border border-border-subtle p-8 rounded-lg shadow-xl backdrop-blur-sm hover:border-brand-orange/50 transition-colors flex flex-col">
            <div className="text-5xl mb-6">🏠</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Residential Repairs</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">From drywall and fixtures to decks and doors. If it's part of your home, we can fix it, upgrade it, or replace it.</p>
            <Link to="/services/residential-repairs" className="text-brand-orange hover:text-brand-hover font-bold uppercase tracking-wider text-sm border-b border-transparent hover:border-brand-hover inline-block w-max">
              Learn More &rarr;
            </Link>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-8 rounded-lg shadow-xl backdrop-blur-sm hover:border-brand-orange/50 transition-colors flex flex-col">
            <div className="text-5xl mb-6">❄️</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Appliance Repairs</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">Ovens, refrigerators, washers, and dryers. We diagnose and repair the essential appliances that keep your household running.</p>
            <Link to="/services/appliance-repair" className="text-brand-orange hover:text-brand-hover font-bold uppercase tracking-wider text-sm border-b border-transparent hover:border-brand-hover inline-block w-max">
              Learn More &rarr;
            </Link>
          </div>
          <div className="bg-wood-800/80 border border-border-subtle p-8 rounded-lg shadow-xl backdrop-blur-sm border-b-4 border-b-brand-orange flex flex-col">
            <div className="text-5xl mb-6">🚨</div>
            <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Emergency Services</h3>
            <p className="text-text-sub leading-relaxed text-lg mb-6 flex-grow">Property issues don't stick to business hours. When things go wrong unexpectedly, we provide fast, dependable emergency fixes to protect your home.</p>
            <Link to="/services/emergency-maintenance" className="text-brand-orange hover:text-brand-hover font-bold uppercase tracking-wider text-sm border-b border-transparent hover:border-brand-hover inline-block w-max">
              Learn More &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3. The Pivot */}
      <section className="bg-wood-card border-y border-border-subtle py-24 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Stop Chasing Repairs.<br/>Start Protecting Your Property.</h2>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-8"></div>
          <p className="text-xl text-text-sub leading-relaxed">
            What if you never had to worry about changing filters, checking detectors, or remembering routine maintenance again? We realized our community needed a better way to manage their homes. That’s why we created a hands-off, worry-free approach to property care.
          </p>
        </div>
      </section>

      {/* 4. The Flagship Offer (The 4-Tier Subscriptions) */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Maintenance Plans Built for Romans, by a Roman.</h2>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-6"></div>
          <p className="text-xl text-text-sub max-w-4xl mx-auto leading-relaxed mb-12">
            Choose the level of care that fits your property and your budget. Pay a flat rate, and let us handle the heavy lifting.
          </p>
        </div>
        
        {/* Top 3 Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Core */}
          <div className="bg-wood-800/90 border border-border-subtle p-8 rounded-lg shadow-lg flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider flex items-center"><span className="text-3xl mr-2">🛡️</span> Core Tier</h3>
                <span className="text-2xl font-bold text-brand-orange">$49</span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">The Annual Safety Audit</p>
              <p className="text-text-sub mb-6 leading-relaxed">Baseline risk mitigation to catch major issues before they become expensive disasters.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Visits:</strong> <span className="text-text-sub">2x per year</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Plumbing & Leaks:</strong> <span className="text-text-sub">Visual inspections under all sinks, toilets, and water heaters.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Safety Devices:</strong> <span className="text-text-sub">Test and replace batteries in all smoke and CO detectors.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">HVAC Baseline:</strong> <span className="text-text-sub">Air filter inspection/replacement and clearing the outdoor compressor unit.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Exterior Integrity:</strong> <span className="text-text-sub">Ground-level visual checks of the roof, gutters, and foundation grading.</span></div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Advanced */}
          <div className="bg-wood-card border-2 border-brand-orange p-8 rounded-lg shadow-[0_10px_30px_rgba(255,95,31,0.15)] flex flex-col h-full relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-wood-900 font-bold uppercase tracking-wider px-6 py-1.5 rounded-full text-sm shadow-md">Most Popular</div>
            <div className="flex-1 mt-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider flex items-center"><span className="text-3xl mr-2">🍂</span> Advanced</h3>
                <span className="text-2xl font-bold text-brand-orange">$129</span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">Four Seasons Turnover</p>
              <p className="text-text-sub mb-6 leading-relaxed">Active preventative care timed perfectly for spring preparation and winterization.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Visits:</strong> <span className="text-text-sub">4x per year</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Labor Included:</strong> <span className="text-text-sub">5 labor hours</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Gutter & Drainage:</strong> <span className="text-text-sub">Clear leaves and debris to prevent water intrusion and rot.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Weatherization:</strong> <span className="text-text-sub">Inspect weatherstripping, draft seals, and winterize exterior hose bibs.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Water Heater:</strong> <span className="text-text-sub">Drain and flush to remove sediment and extend tank life.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Exterior Wood:</strong> <span className="text-text-sub">Early detection inspections for wood rot, termite damage, or peeling paint.</span></div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Premier */}
          <div className="bg-wood-800/90 border border-border-subtle p-8 rounded-lg shadow-lg flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider flex items-center"><span className="text-3xl mr-2">💎</span> Premier Tier</h3>
                <span className="text-2xl font-bold text-brand-orange">$199</span>
              </div>
              <p className="text-sm text-text-main font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">Monthly White-Glove Preventative</p>
              <p className="text-text-sub mb-6 leading-relaxed">The ultimate high-touch experience. Micro-maintenance is handled before you even notice it.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Visits:</strong> <span className="text-text-sub">Monthly</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Labor & Perks:</strong> <span className="text-text-sub">8 labor hours included + 25% off additional quoted repairs.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Hardware Tune-Up:</strong> <span className="text-text-sub">Tighten hinges, knobs, and ensure deadbolts align and latch smoothly.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Caulk & Grout:</strong> <span className="text-text-sub">Touch up caulking around tubs, showers, and counters to stop seepage.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Appliance Efficiency:</strong> <span className="text-text-sub">Clean refrigerator coils and clear dishwasher traps.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Dryer Vent:</strong> <span className="text-text-sub">Remove lint build-up to improve efficiency and eliminate fire hazards.</span></div>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-orange mr-3 mt-1">✓</span>
                  <div><strong className="text-text-main">Plumbing Deep-Dive:</strong> <span className="text-text-sub">Test drain flow rates, check for silent toilet leaks, verify all GFCI.</span></div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Wide Banner (Portfolio Tier) */}
        <div className="bg-gradient-to-br from-wood-800 to-wood-card border border-border-subtle p-8 md:p-12 rounded-lg shadow-xl mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
            <div className="md:w-2/3">
              <h3 className="text-3xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-2 flex items-center"><span className="text-4xl mr-3">🏢</span> The Portfolio Tier</h3>
              <p className="text-sm md:text-base text-brand-orange font-bold uppercase tracking-wider mb-6">Landlord & Investor Solutions</p>
              <p className="text-lg text-text-sub leading-relaxed max-w-3xl">
                Streamlined, flat-rate property care designed for multiple units. We handle the maintenance and tenant turnovers so you can focus on your investments.
              </p>
            </div>
            <div className="md:w-1/3 md:text-right mt-6 md:mt-0">
              <span className="inline-block bg-brand-orange/10 text-brand-orange border border-brand-orange/30 px-6 py-3 rounded-md font-heading font-bold uppercase tracking-wider text-lg">
                Custom Quoted
              </span>
              <p className="text-sm text-text-sub mt-3 italic">Significant volume discounts apply.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-8 border-t border-border-subtle">
            <div className="flex items-start">
              <span className="text-brand-orange text-xl mr-4 mt-1">✓</span>
              <div><strong className="text-text-main text-lg block mb-1">Rapid Rental Turnovers:</strong> <span className="text-text-sub">Seamless coordination of maintenance, repairs, and refreshes to minimize vacancy days.</span></div>
            </div>
            <div className="flex items-start">
              <span className="text-brand-orange text-xl mr-4 mt-1">✓</span>
              <div><strong className="text-text-main text-lg block mb-1">Priority Dispatch:</strong> <span className="text-text-sub">Expedited response times for tenant emergency calls to protect your asset.</span></div>
            </div>
            <div className="flex items-start">
              <span className="text-brand-orange text-xl mr-4 mt-1">✓</span>
              <div><strong className="text-text-main text-lg block mb-1">Standardized Client Intake:</strong> <span className="text-text-sub">Streamlined onboarding, transparent reporting, and consistent care.</span></div>
            </div>
            <div className="flex items-start">
              <span className="text-brand-orange text-xl mr-4 mt-1">✓</span>
              <div><strong className="text-text-main text-lg block mb-1">Dedicated Support:</strong> <span className="text-text-sub">A single point of contact for your entire portfolio's upkeep.</span></div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/maintenance-plans" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-10 py-5 rounded-md transition-colors inline-block text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)]">
            Compare Subscription Details
          </Link>
        </div>
      </section>

      {/* 5. Local Social Proof */}
      <section className="bg-wood-800/80 border-y border-border-subtle py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Proudly Serving Our Neighbors in Rome.</h2>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-16"></div>
          <TestimonialCarousel />
        </div>
      </section>
      
      {/* 6. Owner Bio (Integrated naturally) */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row items-center gap-12 bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
          <div className="w-full md:w-1/3">
            <img src={portrait} alt="Charles Willis, Owner" className="w-full max-w-[300px] mx-auto rounded-lg shadow-2xl border border-brand-orange/30 grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
          <div className="w-full md:w-2/3">
            <h2 className="text-3xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Meet the Man Behind the Hammer</h2>
            <div className="h-1 w-16 bg-brand-orange mb-8"></div>
            <p className="text-xl text-text-main leading-relaxed mb-6 italic border-l-4 border-brand-orange pl-6">
              "When I started Nailed It Property Solutions, I wanted to build something different: a service that local homeowners and property managers could truly rely on. We treat every property like our own, ensuring every fix, patch, and installation stands the test of time."
            </p>
            <p className="text-lg text-text-sub leading-relaxed mb-8">
              Whether you need a quick repair or a major update, you can expect clear communication and absolute respect for your home from the moment we arrive.
            </p>
            <div>
              <p className="text-text-main font-heading font-bold uppercase tracking-widest text-xl">— Charles Willis</p>
              <p className="text-brand-orange text-sm font-bold uppercase tracking-wider mt-1 mb-6">Owner, Nailed It Property Solutions</p>
              <Link to="/about-us" className="inline-block border-2 border-brand-orange text-brand-orange hover:bg-brand-orange/10 font-heading font-bold uppercase tracking-wider px-6 py-2 rounded-md transition-colors text-sm">
                Read Our Story / Meet the Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Trust Badges & Routing (Moved to Bottom) */}
      <section className="bg-wood-800/50 border-t border-border-subtle pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 mb-16">
            <div className="flex items-center text-text-main font-heading font-bold uppercase tracking-wide text-lg md:text-xl">
              <span className="text-3xl mr-3">🛡️</span> Insured
            </div>
            <div className="flex items-center text-text-main font-heading font-bold uppercase tracking-wide text-lg md:text-xl">
              <span className="text-3xl mr-3">⏱️</span> 2-Hour Arrival Guarantee
            </div>
            <div className="flex items-center text-text-main font-heading font-bold uppercase tracking-wide text-lg md:text-xl">
              <span className="text-3xl mr-3">📱</span> 30-Min Text Before Arrival
            </div>
            <div className="flex items-center text-text-main font-heading font-bold uppercase tracking-wide text-lg md:text-xl">
              <span className="text-3xl mr-3">🟢</span> Open 24/7
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
            <Link to="/maintenance-plans" className="text-text-sub hover:text-brand-orange font-bold uppercase tracking-widest border-b-2 border-transparent hover:border-brand-orange transition-colors text-lg">
              I'm a Homeowner &rarr;
            </Link>
            <span className="hidden sm:inline text-border-subtle text-2xl">|</span>
            <Link to="/landlord-solutions" className="text-text-sub hover:text-brand-orange font-bold uppercase tracking-widest border-b-2 border-transparent hover:border-brand-orange transition-colors text-lg">
              I'm a Landlord &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 8. The Final Push (Footer CTA) */}
      <section className="max-w-4xl mx-auto px-4 pb-24 pt-12 text-center">
        <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Ready to simplify your property care?</h2>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-8"></div>
        <p className="text-xl text-text-sub leading-relaxed mb-12">
          Whether you need an emergency appliance repair today or want to set up a subscription for tomorrow, we are ready to get to work.
        </p>
        <Link to="/contact" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-12 py-6 rounded-md transition-all text-xl shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_30px_rgba(255,95,31,0.6)] hover:-translate-y-1 inline-block">
          Let's Get It Nailed
        </Link>
      </section>
    </div>
  );
}

export default Home;

