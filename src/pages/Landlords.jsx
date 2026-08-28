import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import portrait from '../assets/charlesImg.jpg';
import './Landlords.css';

function Landlords() {
  useScrollReveal();
  usePageMeta(
    'Property Management Subscriptions for Landlords | Nailed It Property Solutions Rome, GA',
    'Monthly maintenance subscriptions, unit turnovers, and emergency dispatch for landlords and property managers in Rome, GA. Predictable costs. One point of contact.'
  );

  return (
    <div className="landlords">
      {/* Call Banner */}
      <a href="tel:7062378184" className="scrolling-banner" aria-label="Call us now">
        <div className="banner-track">
          <span>CLICK HERE TO CALL US NOW — <strong className="banner-phone">706.237.8184</strong></span>
        </div>
      </a>

      {/* Hero */}
      <section className="ll-hero">
        <h1>Stop Juggling Unreliable Contractors.</h1>
        <p className="ll-subtitle">
          One monthly subscription. One point of contact. Every property in your portfolio maintained, protected, and ready.
        </p>
        <div className="ll-hero-ctas">
          <a href="#plans" className="cta-button">See Subscription Plans &rarr;</a>
          <Link to="/contact" className="cta-button cta-button--secondary">Contact Us &rarr;</Link>
        </div>
      </section>

      {/* Trust Badges - landlord focused */}
      <section className="ll-trust">
        <div className="trust-items">
          <div className="trust-item"><span className="trust-icon">🛡️</span><span>Licensed &amp; Insured</span></div>
          <div className="trust-item"><span className="trust-icon">📋</span><span>Tenant Portal Included</span></div>
          <div className="trust-item"><span className="trust-icon">🚨</span><span>24/7 Emergency Dispatch</span></div>
          <div className="trust-item"><span className="trust-icon">📊</span><span>Property Management Reports</span></div>
          <div className="trust-item"><span className="trust-icon">💰</span><span>Flat-Rate. No Surprises.</span></div>
        </div>
      </section>

      {/* Meet Charles */}
      <section className="ll-owner reveal">
        <div className="owner-visible">
          <img src={portrait} alt="Charles Willis, Owner" className="owner-portrait" width="200" height="250" />
          <div className="owner-message">
            <h2>Your Single Point of Contact</h2>
            <div className="accent-bar" aria-hidden="true"></div>
            <p>
              &ldquo;I built Nailed It for landlords and property managers who are tired of
              chasing down contractors, managing multiple vendors, and getting surprised by
              invoices. With our subscription model, you get predictable costs, priority response,
              and one person who knows your properties inside and out.&rdquo;
            </p>
            <p className="owner-signature">
              — Charles Willis<br />
              <span>Owner, Nailed It Property Solutions</span>
            </p>
          </div>
        </div>
      </section>

      {/* The Problem for Landlords */}
      <section className="ll-problem reveal">
        <h2>Managing Rentals Shouldn&rsquo;t Mean Managing Chaos.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Tenants calling with emergencies. Contractors who don&rsquo;t return calls. Surprise
          repair bills that blow your monthly budget. Compliance deadlines you can&rsquo;t
          afford to miss. You didn&rsquo;t get into real estate to become a full-time
          maintenance coordinator.
        </p>
        <p>
          Nailed It gives you a structured monthly program so you can be hands-off
          while your properties stay in top shape. We handle the maintenance, the emergencies,
          the tenant work orders, and the reporting &mdash; you collect the rent.
        </p>
      </section>

      {/* Social Proof */}
      <section className="ll-proof reveal">
        <div className="featured-review-card">
          <p className="testimonial-stars">★★★★★</p>
          <p className="featured-review-text">
            &ldquo;Charles is proactive and very detail oriented. He has helped cure my landlord woes.&rdquo;
          </p>
          <p className="featured-review-author">— Charlie Ford</p>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="ll-plans reveal" id="plans">
        <h2>Subscription Plans Built for Your Portfolio</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="ll-plans-intro">
          Predictable monthly pricing. No surprise invoices. Choose the level of care that fits your needs.
        </p>

        <div className="ll-tiers">
          <div className="ll-tier">
            <h3>Essential</h3>
            <p className="ll-tier-price">$99<span>/mo</span></p>
            <p className="ll-tier-tagline">Basic compliance &amp; asset protection</p>
            <ul>
              <li>Bi-annual preventative maintenance (2 visits/year)</li>
              <li>Seasonal gutter cleaning, HVAC filter swaps</li>
              <li>Smoke &amp; CO detector testing</li>
              <li>Annual visual inspection</li>
              <li>Standard tenant portal for work orders</li>
              <li>Annual property management report</li>
            </ul>
          </div>

          <div className="ll-tier ll-tier--popular">
            <span className="tier-badge">Most Popular</span>
            <h3>Proactive</h3>
            <p className="ll-tier-price">$199<span>/mo</span></p>
            <p className="ll-tier-tagline">Faster response &amp; predictable costs</p>
            <ul>
              <li>Quarterly preventative maintenance (4 visits/year)</li>
              <li>2 hours of handyman labor included monthly</li>
              <li>Priority tenant portal — 48-hour guaranteed response</li>
              <li>Bi-annual property management reports</li>
              <li>Everything in Essential</li>
            </ul>
          </div>

          <div className="ll-tier">
            <h3>Comprehensive</h3>
            <p className="ll-tier-price">$399<span>/mo</span></p>
            <p className="ll-tier-tagline">Completely hands-off ownership</p>
            <ul>
              <li>Monthly preventative check-ins (12 visits/year)</li>
              <li>5 hours of handyman labor included monthly</li>
              <li>Emergency dispatch — 24-hour priority response</li>
              <li>Trade coordination &amp; specialist oversight</li>
              <li>Quarterly property management reports</li>
              <li>Everything in Essential &amp; Proactive</li>
            </ul>
          </div>
        </div>

        <Link to="/contact" className="cta-button" style={{ marginTop: '32px' }}>
          Contact Us to Subscribe &rarr;
        </Link>
      </section>

      {/* Unit Turnovers */}
      <section className="ll-turnovers reveal">
        <h2>Unit Turnovers: Move-In Ready in 48 Hours</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="ll-turnovers-intro">
          Vacancy costs you money every day. We get your units rent-ready fast with flat-rate turnover packages.
        </p>
        <div className="ll-turnover-grid">
          <div className="ll-turnover-card">
            <h3>Light Touch-Up</h3>
            <p>Re-key locks, replace filters, test detectors, patch nail holes, replace bulbs.</p>
          </div>
          <div className="ll-turnover-card">
            <h3>Standard Turn</h3>
            <p>Blinds, drywall repair, fixture swaps, paint touch-ups &mdash; plus everything in Light.</p>
          </div>
          <div className="ll-turnover-card">
            <h3>Heavy Turn</h3>
            <p>Major drywall, full painting, door replacements, floor refinishing, appliance repair.</p>
          </div>
          <div className="ll-turnover-card">
            <h3>Heavy Rescue</h3>
            <p>Property trash-outs, major damage repair, asset recovery. Custom pricing after walkthrough.</p>
          </div>
        </div>
        <Link to="/contact" className="cta-button" style={{ marginTop: '24px' }}>
          Schedule a Walkthrough &rarr;
        </Link>
      </section>

      {/* Why Nailed It */}
      <section className="ll-why reveal">
        <h2>Why Landlords Choose Nailed It</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="ll-why-grid">
          <div className="ll-why-item">
            <h3>One Invoice, One Contact</h3>
            <p>No more managing 5 different vendors. Everything goes through Charles.</p>
          </div>
          <div className="ll-why-item">
            <h3>Predictable Costs</h3>
            <p>Flat monthly rate. No surprise invoices. Budget with confidence.</p>
          </div>
          <div className="ll-why-item">
            <h3>Tenant Portal</h3>
            <p>Your tenants submit work orders directly. You stay in the loop without the phone calls.</p>
          </div>
          <div className="ll-why-item">
            <h3>Property Reports</h3>
            <p>Regular documentation of property condition, work completed, and recommended actions.</p>
          </div>
          <div className="ll-why-item">
            <h3>24/7 Emergency Dispatch</h3>
            <p>Pipe burst at 2 AM? We handle it. You get a report in the morning.</p>
          </div>
          <div className="ll-why-item">
            <h3>Trade Coordination</h3>
            <p>Need a specialist? We diagnose, dispatch, oversee, and ensure quality — you don&rsquo;t lift a finger.</p>
          </div>
        </div>
      </section>

      {/* Second Review */}
      <section className="ll-proof reveal">
        <div className="featured-review-card">
          <p className="testimonial-stars">★★★★★</p>
          <p className="featured-review-text">
            &ldquo;Charles replaced our water heater the same day we called. Fair price
            for such a rapid response. We&rsquo;re signing up for the subscription plan.&rdquo;
          </p>
          <p className="featured-review-author">— Marcus Thompson</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ll-cta reveal">
        <h2>Let Us Handle the Maintenance. You Handle the Portfolio.</h2>
        <p>Join Rome landlords who&rsquo;ve stopped chasing contractors and started sleeping better.</p>
        <div className="ll-cta-buttons">
          <Link to="/contact" className="cta-button">Get Started &rarr;</Link>
          <a href="tel:7062378184" className="cta-button cta-button--secondary">Call 706.237.8184</a>
        </div>
      </section>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-action-bar">
        <a href="tel:7062378184" className="action-btn action-btn--call">📞 Call Now</a>
        <a href="sms:7062378184" className="action-btn action-btn--text">💬 Text Us</a>
      </div>
    </div>
  );
}

export default Landlords;

