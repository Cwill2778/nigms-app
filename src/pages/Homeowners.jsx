import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import NameYourPrice from '../components/NameYourPrice';
import portrait from '../assets/charlesImg.jpg';
import './Homeowners.css';

function Homeowners() {
  useScrollReveal();
  usePageMeta(
    'Home Repairs & Maintenance for Rome, GA Homeowners | Nailed It Property Solutions',
    'Reliable home repairs, emergency fixes, and preventative maintenance for homeowners in Rome, GA. Licensed, insured, and available 24/7.'
  );

  return (
    <div className="homeowners">
      {/* Call Banner */}
      <a href="tel:+17068448193" className="scrolling-banner" aria-label="Call us now">
        <div className="banner-track">
          <span>CLICK HERE TO CALL US NOW — <strong className="banner-phone">(706) 844-8193</strong></span>
        </div>
      </a>

      {/* Hero */}
      <section className="ho-hero">
        <h1>Your Home Deserves Better Than &ldquo;Good Enough.&rdquo;</h1>
        <p className="ho-subtitle">
          Honest repairs, fair prices, and a team that actually shows up. Serving Rome, GA homeowners 24/7.
        </p>
      </section>

      {/* Trust Badges */}
      <section className="ho-trust">
        <div className="trust-items">
          <div className="trust-item"><span className="trust-icon">🛡️</span><span>Licensed &amp; Insured</span></div>
          <div className="trust-item"><span className="trust-icon">✅</span><span>Nailed It Guarantee</span></div>
          <div className="trust-item"><span className="trust-icon">⏱️</span><span>2-Hour Arrival Window</span></div>
          <div className="trust-item"><span className="trust-icon">📱</span><span>30-Min Text Before Arrival</span></div>
          <div className="trust-item"><span className="trust-icon">🟢</span><span>Open 24/7</span></div>
        </div>
      </section>

      {/* Meet Charles */}
      <section className="ho-owner reveal">
        <div className="owner-visible">
          <img src={portrait} alt="Charles Willis, Owner" className="owner-portrait" width="200" height="250" />
          <div className="owner-message">
            <h2>Meet the Man Behind the Hammer</h2>
            <div className="accent-bar" aria-hidden="true"></div>
            <p>
              &ldquo;I started Nailed It because homeowners in Rome deserve a contractor who
              shows up on time, gives an honest price, and does the work right. No ghosting.
              No surprise fees. No band-aid fixes. We treat every home like our own.&rdquo;
            </p>
            <p className="owner-signature">
              — Charles Willis<br />
              <span>Owner, Nailed It Property Solutions</span>
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="ho-problem reveal">
        <h2>Finding a Reliable Repairman Shouldn&rsquo;t Be This Hard.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          You call three contractors. One ghosts you. One shows up late with no quote.
          The third gives you a price that doubles halfway through the job. Sound familiar?
        </p>
        <p>
          We built Nailed It because that&rsquo;s not acceptable. Show up on time.
          Give an honest price. Do the work right. It really is that simple &mdash; and
          that&rsquo;s exactly what we do, every single time.
        </p>
      </section>

      {/* Featured Review */}
      <section className="ho-featured-review reveal">
        <div className="featured-review-card">
          <p className="testimonial-stars">★★★★★</p>
          <p className="featured-review-text">
            &ldquo;We had three different contractors ghost us before finding Nailed It.
            Charles showed up, gave us an honest quote, and did the work right.&rdquo;
          </p>
          <p className="featured-review-author">— Sandra &amp; Bill Henderson</p>
        </div>
      </section>

      {/* What We Fix */}
      <section className="ho-services reveal">
        <h2>What We Fix</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="ho-services-grid">
          <div className="ho-service-card">
            <h3>Drywall &amp; Finishing</h3>
            <p>Patch to perfection. Sheetrock, mudding, texture matching.</p>
          </div>
          <div className="ho-service-card">
            <h3>Interior Painting</h3>
            <p>Proper prep. Clean lines. Full room or touch-ups.</p>
          </div>
          <div className="ho-service-card">
            <h3>Plumbing Repairs</h3>
            <p>Leaks, fixtures, water heaters, toilets. Peace of mind.</p>
          </div>
          <div className="ho-service-card">
            <h3>Exterior &amp; Decks</h3>
            <p>Deck repair, pressure washing, siding, stairs.</p>
          </div>
          <div className="ho-service-card">
            <h3>Windows &amp; Doors</h3>
            <p>Replacement, frame repair, weathersealing.</p>
          </div>
          <div className="ho-service-card">
            <h3>General Repairs</h3>
            <p>Cabinets, fixtures, blinds, shelving — if it&rsquo;s broken, we fix it.</p>
          </div>
        </div>
        <Link to="/services" className="cta-button" style={{ marginTop: '24px' }}>See Full Service List &rarr;</Link>
      </section>

      {/* Emergency / 24-7 */}
      <section className="ho-crisis reveal">
        <h2>We Are Here for You in Your Time of Crisis.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Burst pipe at 6 AM? Hot water heater gave out on a Sunday? We don&rsquo;t
          believe in &ldquo;business hours only&rdquo; when your home is at stake.
          Call us, describe what&rsquo;s happening, and we&rsquo;ll dispatch within
          our 2-hour arrival window &mdash; no surprise fees, no runaround.
        </p>
        <a href="tel:+17068448193" className="cta-button">Call Now &mdash; (706) 844-8193</a>
      </section>

      {/* Second Featured Review */}
      <section className="ho-featured-review reveal">
        <div className="featured-review-card">
          <p className="testimonial-stars">★★★★★</p>
          <p className="featured-review-text">
            &ldquo;Charles replaced our water heater the same day we called.
            Fair price for such a rapid response.&rdquo;
          </p>
          <p className="featured-review-author">— Marcus Thompson</p>
        </div>
      </section>

      {/* Name Your Price */}
      <section className="ho-form reveal">
        <h2>Ready? Tell Us What You Need.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="form-intro">Set your budget and describe the job. We&rsquo;ll get back to you with an honest assessment.</p>
        <NameYourPrice />
      </section>

      {/* Final CTA */}
      <section className="ho-cta reveal">
        <h2>Take the Hammer Out of Your Hands.</h2>
        <p>Ready to stop worrying about your to-do list? Let us handle it.</p>
        <div className="ho-cta-buttons">
          <Link to="/contact" className="cta-button">Get a Free Quote &rarr;</Link>
          <a href="tel:+17068448193" className="cta-button cta-button--secondary">Call (706) 844-8193</a>
        </div>
      </section>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-action-bar">
        <a href="tel:+17068448193" className="action-btn action-btn--call">📞 Call Now</a>
        <a href="sms:+17068448193" className="action-btn action-btn--text">💬 Text Us</a>
      </div>
    </div>
  );
}

export default Homeowners;
