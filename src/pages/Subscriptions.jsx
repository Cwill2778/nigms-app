import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import './Subscriptions.css';

function Subscriptions() {
  useScrollReveal();

  return (
    <div className="subscriptions">
      <section className="subs-intro reveal">
        <h1>Maintenance Plans</h1>
        <p>
          Predictable monthly pricing. No surprise invoices. Choose the level of
          care that fits your property — from basic protection to fully hands-off
          management.
        </p>
      </section>

      <section className="subs-tiers reveal">
        <h2 className="subs-tiers-heading">Choose Your Plan</h2>
        <div className="accent-bar" aria-hidden="true"></div>

        <div className="tiers-grid">
          {/* Essential */}
          <div className="tier-card">
            <p className="tier-name">Essential</p>
            <p className="tier-price"><span>Starting at </span>$99<span>/mo per property</span></p>
            <p className="tier-promise">Basic compliance &amp; asset protection.</p>
            <ul className="tier-features">
              <li>Bi-annual preventative maintenance (2 visits/year)</li>
              <li>Seasonal gutter cleaning, HVAC filter swaps, smoke/CO battery replacement</li>
              <li>Annual visual inspection (exterior &amp; interior)</li>
              <li>Standard tenant portal for work orders (labor billed at standard rate + materials)</li>
              <li>Annual property management report</li>
            </ul>
            <Link to="/contact" className="cta-button cta-button--secondary">
              Get Started
            </Link>
          </div>

          {/* Proactive — Most Popular */}
          <div className="tier-card tier-card--popular">
            <span className="tier-badge">Most Popular</span>
            <p className="tier-name">Proactive</p>
            <p className="tier-price"><span>Starting at </span>$199<span>/mo per property</span></p>
            <p className="tier-promise">Faster response &amp; predictable maintenance costs.</p>
            <ul className="tier-features">
              <li>Quarterly preventative maintenance (4 visits/year)</li>
              <li>2 hours of handyman labor included monthly (materials billed separately)</li>
              <li>Priority tenant portal — guaranteed 48-hour response</li>
              <li>Bi-annual property management reports</li>
              <li>Everything in Essential</li>
            </ul>
            <Link to="/contact" className="cta-button">
              Get Started
            </Link>
          </div>

          {/* Comprehensive */}
          <div className="tier-card">
            <p className="tier-name">Comprehensive</p>
            <p className="tier-price"><span>Starting at </span>$399<span>/mo per property</span></p>
            <p className="tier-promise">Completely hands-off property ownership.</p>
            <ul className="tier-features">
              <li>Monthly preventative check-ins (12 visits/year)</li>
              <li>5 hours of handyman labor included monthly</li>
              <li>Emergency dispatch — guaranteed 24-hour priority response</li>
              <li>Trade coordination: we diagnose, dispatch specialists, oversee work &amp; ensure quality</li>
              <li>Quarterly property management reports</li>
              <li>Everything in Essential &amp; Proactive</li>
            </ul>
            <Link to="/contact" className="cta-button cta-button--secondary">
              Get Started
            </Link>
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
