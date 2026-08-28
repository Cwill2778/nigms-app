import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import clocktower from '../assets/clocktowerRomansDigital.jpg';
import './Subscriptions.css';

function Subscriptions() {
  useScrollReveal();
  usePageMeta(
    'Property Maintenance Subscriptions Rome, GA | Nailed It',
    'Protect your Rome, GA property with our 4-tier preventative maintenance plans: Core, Advanced, Premier, and Portfolio Management.'
  );

  const [promo, setPromo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'promo_banner')
      .single()
      .then(({ data }) => {
        if (data?.value?.enabled) setPromo(data.value);
      });
  }, []);

  const handleCheckout = (tier) => {
    navigate(`/checkout?tier=${tier}`);
  };

  return (
    <div className="subscriptions">
      <section className="subs-intro reveal">
        {promo && (
          <div className="subs-promo">
            <p className="promo-badge">Limited Time Offer</p>
            <p className="promo-headline">{promo.text}</p>
          </div>
        )}
        <h1>Maintenance Plans</h1>
        <p>
          Predictable monthly pricing. No surprise invoices. Choose the level of
          care that fits your property — from basic protection to fully hands-off
          management.
        </p>
        <div className="subs-intro-philosophy">
          <p>
            For residential property maintenance and rental turnover, an effective inspection checklist serves two primary purposes: <strong>preventing catastrophic damage</strong> (like undetected water leaks) and keeping the property in <strong>peak cosmetic condition</strong>.
          </p>
          <p>
            In a climate like North Georgia, it is also critical to align the bi-annual and quarterly visits with seasonal weather shifts to ensure the property is protected year-round.
          </p>
        </div>
      </section>

      <section className="subs-tiers reveal">
        <h2 className="subs-tiers-heading">Choose Your Plan</h2>
        <div className="accent-bar" aria-hidden="true"></div>

        <div className="tiers-grid four-col">
          {/* Core */}
          <div className="tier-card">
            <p className="tier-name">Core</p>
            <p className="tier-price"><span>Starting at </span>$49<span>/mo</span></p>
            <p className="tier-promise">Your baseline protection & regular maintenance schedule.</p>
            <ul className="tier-features">
              <li>Annual check-up & inspection</li>
              <li>Standard response time (48 hours)</li>
              <li>Standard rate for trip/call-out fees</li>
              <li>Standard rate for labor & parts</li>
              <li>Basic service record</li>
            </ul>
            <button onClick={() => handleCheckout('core')} className="cta-button cta-button--secondary">
              Get Started
            </button>
          </div>

          {/* Advanced — Most Popular */}
          <div className="tier-card tier-card--popular">
            <span className="tier-badge">Most Popular</span>
            <p className="tier-name">Advanced</p>
            <p className="tier-price"><span>Starting at </span>$129<span>/mo</span></p>
            <p className="tier-promise">Proactive interventions and financial perks.</p>
            <ul className="tier-features">
              <li>Bi-annual check-ups & inspections</li>
              <li>Priority response time (24 hours)</li>
              <li><strong>50% discount</strong> on trip / call-out fees</li>
              <li><strong>10% discount</strong> on parts & materials</li>
              <li>Standard rate for labor on repairs</li>
              <li>Digital performance report</li>
            </ul>
            <button onClick={() => handleCheckout('advanced')} className="cta-button">
              Get Started
            </button>
          </div>

          {/* Premier */}
          <div className="tier-card">
            <p className="tier-name">Premier</p>
            <p className="tier-price"><span>Starting at </span>$199<span>/mo</span></p>
            <p className="tier-promise">Maximum peace of mind for high-value properties.</p>
            <ul className="tier-features">
              <li>Quarterly deep-dives & inspections</li>
              <li>Same-day priority response</li>
              <li><strong>Completely waived</strong> trip / call-out fees</li>
              <li><strong>Minor fixes included</strong> in labor</li>
              <li><strong>20% discount</strong> on parts & materials</li>
              <li>Priority recommendations & strategy</li>
            </ul>
            <button onClick={() => handleCheckout('premier')} className="cta-button cta-button--secondary">
              Get Started
            </button>
          </div>

          {/* Portfolio Management */}
          <div className="tier-card tier-card--enterprise">
            <p className="tier-name">Portfolio Management</p>
            <p className="tier-price"><span>Custom</span> Pricing</p>
            <p className="tier-promise">Enterprise-grade solution for multiple locations.</p>
            <ul className="tier-features">
              <li>Custom schedule per asset</li>
              <li>24/7 VIP dispatch & response</li>
              <li><strong>Completely waived</strong> trip / call-out fees</li>
              <li>Custom SLA / Bulk rates for labor</li>
              <li><strong>At-cost or bulk pricing</strong> for parts</li>
              <li>Dedicated Account Manager & Centralized Reporting</li>
            </ul>
            <Link to="/contact" className="cta-button cta-button--outline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <section className="subs-checklists reveal" id="checklists">
        <h2>The Maintenance Checklists</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="checklists-intro">Here is how we structure the exact services for each tier to protect your investment.</p>
        
        <div className="checklist-tiers">
          <div className="checklist-tier">
            <h3>Core Tier — The Annual Safety Audit</h3>
            <p className="checklist-goal"><strong>Goal:</strong> Baseline risk mitigation. We get into the property once a year to catch major issues before they become expensive disasters.</p>
            <ul className="checklist-items">
              <li><strong>Plumbing & Leaks:</strong> Visual inspection of pipes under all sinks, around the base of toilets, and at the water heater.</li>
              <li><strong>Safety Devices:</strong> Test all smoke and carbon monoxide detectors; replace batteries as needed.</li>
              <li><strong>HVAC Baseline:</strong> Inspect the air filter (replace if client provides a new one) and ensure outdoor compressor unit is clear of vegetation and debris.</li>
              <li><strong>Exterior Integrity:</strong> Ground-level visual check of the roof, gutters, and foundation grading for obvious damage or drainage issues.</li>
            </ul>
          </div>

          <div className="checklist-tier checklist-tier--advanced">
            <h3>Advanced Tier — Bi-Annual Seasonal Turnover</h3>
            <p className="checklist-goal"><strong>Goal:</strong> Active preventative care, timed perfectly for spring preparation and fall winterization. <em>Includes everything in Core, plus:</em></p>
            <ul className="checklist-items">
              <li><strong>Gutter & Drainage (Spring/Fall):</strong> Clear gutters and downspouts of leaves and debris to prevent water intrusion and fascia rot.</li>
              <li><strong>Weatherization (Fall):</strong> Inspect window weatherstripping, check door seals for drafts, and winterize exterior hose bibs to prevent frozen pipes.</li>
              <li><strong>Water Heater Maintenance (Spring):</strong> Drain and flush the water heater to remove sediment build-up and extend tank lifespan.</li>
              <li><strong>Exterior Wood & Trim:</strong> Inspect decks, porches, and window trim for early signs of wood rot, termite damage, or peeling paint.</li>
            </ul>
          </div>

          <div className="checklist-tier checklist-tier--premier">
            <h3>Premier Tier — Quarterly White-Glove Preventative</h3>
            <p className="checklist-goal"><strong>Goal:</strong> High-touch micro-maintenance. When we are on-site every 3 months, we handle the things homeowners and tenants neglect. <em>Includes everything in Advanced, plus:</em></p>
            <ul className="checklist-items">
              <li><strong>Hardware Tune-Up:</strong> Tighten loose door hinges, cabinet knobs, towel bars, and ensure deadbolts and locks align and latch smoothly.</li>
              <li><strong>Caulk & Grout Integrity:</strong> Inspect and touch up caulking around tubs, showers, and kitchen countertops to prevent water seeping behind walls.</li>
              <li><strong>Appliance Efficiency:</strong> Clean refrigerator condenser coils (reduces energy draw) and clear the dishwasher trap/filter.</li>
              <li><strong>Dryer Vent Clearing:</strong> Remove lint build-up from the dryer vent line to prevent fire hazards and improve drying efficiency.</li>
              <li><strong>Plumbing Deep-Dive:</strong> Test flow rates on all drains, check toilet flappers for silent running leaks, and test all GFCI outlets to ensure electrical safety near water.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="subs-how reveal">
        <h2>How It Works</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="how-steps">
          <div className="how-step">
            <span className="step-number">01</span>
            <div className="step-content">
              <h3>Choose Your Tier</h3>
              <p>Pick the plan that matches your property&rsquo;s needs and your budget.</p>
            </div>
          </div>
          <div className="how-step">
            <span className="step-number">02</span>
            <div className="step-content">
              <h3>We Inspect &amp; Schedule</h3>
              <p>We visit your property, assess its condition, and set your maintenance calendar.</p>
            </div>
          </div>
          <div className="how-step">
            <span className="step-number">03</span>
            <div className="step-content">
              <h3>Relax</h3>
              <p>We handle the rest. You get reports, priority service, and peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="subs-cta reveal">
        <h2>Ready to Get Your Property on Autopilot?</h2>
        <img
          src={clocktower}
          alt="Rome, Georgia clocktower — serving the local community"
          className="subs-community-img"
          width="600"
          height="300"
        />
        <p>
          No long-term contracts required. Cancel anytime. Let&rsquo;s talk about
          which plan fits your situation.
        </p>
        <Link to="/contact" className="cta-button">
          Contact Us to Subscribe
        </Link>
      </section>
    </div>
  );
}

export default Subscriptions;
