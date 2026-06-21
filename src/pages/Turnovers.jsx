import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import './Turnovers.css';

function Turnovers() {
  useScrollReveal();
  usePageMeta(
    'Rental Unit Turnovers & Make-Readies Rome, GA | Nailed It',
    'Fast, reliable rental unit turnovers in Rome, GA. We help landlords minimize vacancy time with professional painting, repairs, and make-ready services.'
  );

  return (
    <div className="turnovers">
      <section className="turns-intro reveal">
        <h1>Unit Turnovers</h1>
        <p>
          Done right so it rents right. We get your vacant unit move-in ready
          with thorough, professional turnover services — no corners cut, no
          details missed.
        </p>
        <p className="turns-guarantee">Standard turnover guaranteed in 48 hrs or less.*</p>
        <p className="turns-disclaimer">*Restrictions and limits apply.</p>
      </section>

      <section className="turns-assessment reveal">
        <h2>It Starts with a Walkthrough</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Every property is different. We start with an on-site assessment to
          evaluate the unit&rsquo;s condition and build a detailed turnover scope
          tailored to what your property actually needs.
        </p>
        <p className="assessment-price">$75 – $100 Assessment Fee</p>
        <p className="assessment-note">
          Credited toward your final invoice if you approve the turnover proposal.
        </p>
      </section>

      <section className="turns-process reveal">
        <h2>The &ldquo;Rent-Ready&rdquo; Turnover Process</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="process-steps">
          <div className="process-step">
            <span className="process-step-number">01</span>
            <div className="process-step-content">
              <h3>Precision Paint Touch-Ups</h3>
              <p>We touch up walls, trim, and baseboards to erase the wear-and-tear of the previous tenant, restoring a clean, flawless aesthetic that shows beautifully.</p>
            </div>
          </div>
          <div className="process-step">
            <span className="process-step-number">02</span>
            <div className="process-step-content">
              <h3>Move-In Ready Floors</h3>
              <p>We perform a thorough cleaning ensuring the property looks move-in ready the second a prospective renter walks through the door.</p>
            </div>
          </div>
          <div className="process-step">
            <span className="process-step-number">03</span>
            <div className="process-step-content">
              <h3>Odor Neutralization &amp; Climate Prep</h3>
              <p>First impressions matter. We eliminate stale odors by placing deodorizers in the fridge and freezer, and install ambient air fresheners in the main living spaces to create a highly welcoming environment for your showings.</p>
            </div>
          </div>
          <div className="process-step">
            <span className="process-step-number">04</span>
            <div className="process-step-content">
              <h3>Immediate Security Swap</h3>
              <p>We protect your liability by installing brand-new locks on all exterior entry points, guaranteeing total security for the property and complete peace of mind for your next tenant.</p>
            </div>
          </div>
          <div className="process-step">
            <span className="process-step-number">05</span>
            <div className="process-step-content">
              <h3>Functional Baseline Audit</h3>
              <p>We rigorously test all major appliances, windows, and essential fixtures. If something is broken, we catch it and report it to you immediately — eliminating frustrating &ldquo;Day One&rdquo; maintenance calls from your new renter.</p>
            </div>
          </div>
          <div className="process-step">
            <span className="process-step-number">06</span>
            <div className="process-step-content">
              <h3>Secured &amp; Ready-to-Show Hand-Off</h3>
              <p>We perform a final quality-control walkthrough, switch off all lights to save on utilities, lock down the property, and deliver the keys directly back to you. Your property is officially ready to list.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="turns-packages reveal">
        <h2>Turnover Packages</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Flat-rate pricing based on scope — no hourly surprises. Materials
          billed separately at cost. Starting at $249.99.
        </p>

        <div className="packages-grid">
          <div className="package-card">
            <p className="package-name">Light Touch-Up</p>
            <p className="package-description">
              Minor work to get a well-maintained unit ready for the next tenant.
            </p>
            <ul className="package-includes">
              <li>Re-key locks</li>
              <li>Replace HVAC filters</li>
              <li>Test smoke &amp; CO detectors</li>
              <li>Tighten cabinet hinges</li>
              <li>Patch nail holes in drywall</li>
              <li>Replace burnt-out bulbs</li>
            </ul>
          </div>

          <div className="package-card">
            <p className="package-name">Standard Turn</p>
            <p className="package-description">
              More involved work for units with moderate wear from the previous tenant.
            </p>
            <ul className="package-includes">
              <li>Everything in Light Touch-Up</li>
              <li>Replace broken blinds</li>
              <li>Repair medium drywall damage</li>
              <li>Swap damaged faucet or fixture</li>
              <li>Touch up paint on trim &amp; baseboards</li>
            </ul>
          </div>

          <div className="package-card">
            <p className="package-name">Heavy Turn</p>
            <p className="package-description">
              Significant restoration for units that took a beating.
            </p>
            <ul className="package-includes">
              <li>Everything in Standard Turn</li>
              <li>Major drywall repair</li>
              <li>Full room painting</li>
              <li>Door replacements</li>
              <li>Repair minor tenant vandalism</li>
              <li>Sand &amp; refinish hardwood floors</li>
              <li>Replace or repair appliances</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="turns-heavy-rescue reveal">
        <h2>The &ldquo;Heavy Rescue&rdquo; Add-Ons</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Unfortunately, not every tenant respects your investment. When a
          property is left full of abandoned garbage or significant damage, our
          Heavy Rescue services step in to stop the bleeding and get your asset
          back on the market.
        </p>

        <div className="rescue-items">
          <div className="rescue-item">
            <h3>Complete Property Trash-Outs</h3>
            <p>
              Don&rsquo;t waste a weekend hauling away a bad tenant&rsquo;s mess. We
              remove and dispose of abandoned furniture, excessive garbage, and
              heavy debris. We handle the heavy lifting, the truck wear-and-tear,
              and the dump fees, leaving you with a completely cleared unit ready
              for repairs.
            </p>
          </div>

          <div className="rescue-item">
            <h3>Major Drywall &amp; Damage Repair</h3>
            <p>
              From doorknob holes to severe wall damage, kicked-in doors, and
              chewed-up baseboards, we patch, sand, and repair significant cosmetic
              damage to completely erase the previous tenant&rsquo;s footprint.
            </p>
          </div>

          <div className="rescue-item">
            <h3>Asset Recovery &amp; Hardware Replacement</h3>
            <p>
              We quickly swap out smashed blinds, broken light fixtures, ripped
              window screens, and destroyed cabinet hardware, bringing the unit
              back up to your high standards without needing to call in multiple
              expensive sub-contractors.
            </p>
          </div>
        </div>

        <p className="rescue-note">
          Heavy Rescue services and Trash-Outs are quoted on a custom, flat-rate
          project basis after our initial walkthrough. We assess the damage, give
          you a straightforward price, and get straight to work.
        </p>
      </section>

      <section className="turns-cta reveal">
        <h2>Have a Vacant Unit?</h2>
        <p>
          Let&rsquo;s schedule a walkthrough. We&rsquo;ll assess the property, build
          your turnover scope, and give you an honest flat-rate quote.
        </p>
        <Link to="/contact" className="cta-button">
          Schedule a Walkthrough
        </Link>
      </section>
    </div>
  );
}

export default Turnovers;
