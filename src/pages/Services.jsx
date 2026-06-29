import { useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import miniBar from '../assets/miniBar.jpg';
import charlesWorking1 from '../assets/CharlesWorking1.jpg';
import charlesWorking2 from '../assets/CharlesWorking2.jpg';
import charlesAtWork from '../assets/charlesAtWorkIII.jpg';
import kitchenBefore from '../assets/HarveyKitchenWallBefore.jpg';
import kitchenAfter from '../assets/HarveyKitchenWallAfter.jpg';
import './Services.css';

function ExpandCard({ title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`expand-card${open ? ' expand-card--open' : ''}`}>
      <button className="expand-card-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="expand-card-subtitle">{subtitle}</p>}
        </div>
        <span className="expand-card-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="expand-card-body">{children}</div>}
    </div>
  );
}

function Services() {
  useScrollReveal();
  usePageMeta(
    'Services, Subscriptions & Turnovers | Nailed It Property Solutions',
    'Explore all property maintenance services, subscription plans, and unit turnover packages from Nailed It Property Solutions in Rome, GA.'
  );

  return (
    <div className="services">
      <section className="services-hero reveal">
        <h1>What We Do</h1>
        <p>Flat-rate pricing. No hidden fees. Quality work you can count on.</p>
      </section>

      {/* Service Categories */}
      <section className="services-section reveal">
        <h2>Repair &amp; Maintenance Services</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="services-cards">
          <ExpandCard title="Drywall & Finishing" subtitle="Patch to perfection.">
            <ul>
              <li>Sheetrock hanging & installation</li>
              <li>Mudding, taping & smooth finish</li>
              <li>Drywall patching (nail holes to large damage)</li>
              <li>Texture matching</li>
              <li>Custom built-in shelving & features</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Interior Painting" subtitle="Proper prep. Clean lines.">
            <ul>
              <li>Full room painting</li>
              <li>Trim & baseboard touch-ups</li>
              <li>Proper prep (sanding, priming, taping)</li>
              <li>Color matching</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Plumbing Repairs" subtitle="Leaks, fixtures, and peace of mind.">
            <ul>
              <li>Leaking faucet repair / replacement</li>
              <li>Running toilet repair</li>
              <li>Water heater maintenance</li>
              <li>Fixture replacement</li>
              <li>General plumbing troubleshooting</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Exterior & Decks" subtitle="Curb appeal that lasts.">
            <ul>
              <li>Deck repair & restoration</li>
              <li>Pressure washing</li>
              <li>Siding repair</li>
              <li>Stair replacement & repair</li>
              <li>Outdoor living space construction</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Windows & Doors" subtitle="Sealed tight. Opens right.">
            <ul>
              <li>Window replacement (single & multi-pane)</li>
              <li>Door replacement</li>
              <li>Frame repair</li>
              <li>Weathersealing & insulation</li>
              <li>Hardware adjustment & replacement</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="General Repairs" subtitle="If it's broken, we fix it.">
            <ul>
              <li>Cabinet hinge tightening & adjustment</li>
              <li>Light fixture replacement</li>
              <li>Blind replacement</li>
              <li>Minor carpentry (shelving, trim)</li>
              <li>Anything else that's wearing out</li>
            </ul>
          </ExpandCard>
        </div>
        <Link to="/contact" className="cta-button services-cta-btn">Get a Free Quote &rarr;</Link>
      </section>

      {/* Subscription Plans */}
      <section className="services-section reveal">
        <h2>Maintenance Subscriptions</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="section-intro">Predictable monthly pricing. No surprise invoices. Choose your level of care.</p>
        <div className="services-cards">
          <ExpandCard title="Essential — $99/mo" subtitle="Basic compliance & asset protection.">
            <ul>
              <li>Bi-annual preventative maintenance (2 visits/year)</li>
              <li>Seasonal gutter cleaning, HVAC filter swaps</li>
              <li>Smoke & CO detector testing</li>
              <li>Annual visual inspection</li>
              <li>Standard tenant portal for work orders</li>
              <li>Annual property management report</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Proactive — $199/mo" subtitle="Faster response & predictable costs.">
            <ul>
              <li>Quarterly preventative maintenance (4 visits/year)</li>
              <li>2 hours of handyman labor included monthly</li>
              <li>Priority tenant portal — 48-hour guaranteed response</li>
              <li>Bi-annual property management reports</li>
              <li>Everything in Essential</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Comprehensive — $399/mo" subtitle="Completely hands-off ownership.">
            <ul>
              <li>Monthly preventative check-ins (12 visits/year)</li>
              <li>5 hours of handyman labor included monthly</li>
              <li>Emergency dispatch — 24-hour priority response</li>
              <li>Trade coordination & specialist oversight</li>
              <li>Quarterly property management reports</li>
              <li>Everything in Essential & Proactive</li>
            </ul>
          </ExpandCard>
        </div>
        <Link to="/contact" className="cta-button services-cta-btn">Contact Us to Subscribe &rarr;</Link>
      </section>

      {/* Unit Turnovers */}
      <section className="services-section reveal">
        <h2>Unit Turnovers</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="section-intro">Move-in ready in 48 hours or less. $75–$100 assessment fee (credited toward your invoice).</p>
        <div className="services-cards">
          <ExpandCard title="Light Touch-Up" subtitle="Minor work for well-maintained units.">
            <ul>
              <li>Re-key locks</li>
              <li>Replace HVAC filters</li>
              <li>Test smoke & CO detectors</li>
              <li>Tighten cabinet hinges</li>
              <li>Patch nail holes in drywall</li>
              <li>Replace burnt-out bulbs</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Standard Turn" subtitle="Moderate wear from previous tenant.">
            <ul>
              <li>Everything in Light Touch-Up</li>
              <li>Replace broken blinds</li>
              <li>Repair medium drywall damage</li>
              <li>Swap damaged faucet or fixture</li>
              <li>Touch up paint on trim & baseboards</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Heavy Turn" subtitle="Significant restoration needed.">
            <ul>
              <li>Everything in Standard Turn</li>
              <li>Major drywall repair</li>
              <li>Full room painting</li>
              <li>Door replacements</li>
              <li>Repair minor tenant vandalism</li>
              <li>Sand & refinish hardwood floors</li>
              <li>Replace or repair appliances</li>
            </ul>
          </ExpandCard>
          <ExpandCard title="Heavy Rescue Add-Ons" subtitle="When a property took a beating.">
            <ul>
              <li>Complete property trash-outs</li>
              <li>Major drywall & damage repair</li>
              <li>Asset recovery & hardware replacement</li>
              <li>Custom flat-rate project pricing after walkthrough</li>
            </ul>
          </ExpandCard>
        </div>
        <Link to="/contact" className="cta-button services-cta-btn">Schedule a Walkthrough &rarr;</Link>
      </section>

      {/* Materials */}
      <section className="services-section services-materials reveal">
        <h2>Who Supplies Materials?</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="materials-options-display">
          <div className="material-card">
            <h3>You Supply</h3>
            <p>Buy your own fixtures, paint, or parts — we provide the labor and expertise to install them right.</p>
          </div>
          <div className="material-card">
            <h3>We Supply</h3>
            <p>We source quality materials at cost and handle everything. One price, no extra trips to the store.</p>
          </div>
          <div className="material-card">
            <h3>Not Sure?</h3>
            <p>No problem. We'll assess the job and recommend the best option for your budget and timeline.</p>
          </div>
        </div>
      </section>

      {/* Work Gallery */}
      <section className="services-section services-gallery reveal">
        <h2>Our Work</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="gallery-grid">
          <img src={miniBar} alt="Custom mini bar build" />
          <img src={kitchenBefore} alt="Kitchen wall before — exposed framing" />
          <img src={kitchenAfter} alt="Kitchen wall after — smooth finish" />
          <img src={charlesWorking1} alt="Charles working on a property" />
          <img src={charlesWorking2} alt="Charles on another job site" />
          <img src={charlesAtWork} alt="Charles at work" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="services-final-cta reveal">
        <h2>Need Something Taken Care Of?</h2>
        <p>Tell us what&rsquo;s going on. We&rsquo;ll give you an honest assessment and a fair price.</p>
        <Link to="/contact" className="cta-button">Get a Free Quote &rarr;</Link>
      </section>
    </div>
  );
}

export default Services;
