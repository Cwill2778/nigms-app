import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import protectedHome from '../assets/nailedItProtectedHome.jpg';
import './Home.css';

function Home() {
  useScrollReveal();

  return (
    <div className="home">
      <Link to="/subscriptions" className="scrolling-banner" aria-label="View subscription plans">
        <div className="banner-track">
          <span>🔨 Rome&rsquo;s #1 Choice for Property Maintenance — See Why the Peace of Mind Plan is Our Most Popular &rarr;</span>
          <span>🔨 Rome&rsquo;s #1 Choice for Property Maintenance — See Why the Peace of Mind Plan is Our Most Popular &rarr;</span>
        </div>
      </Link>

      <section className="home-protected">
        <img
          src={protectedHome}
          alt="Home protected by a Nailed It Property Solutions subscription"
          className="protected-image"
        />
        <p className="protected-headline">Equip your home today with a Nailed It subscription.</p>
      </section>

      <section className="home-intro">
        <h1>Don&rsquo;t Just Fix It. <span className="hero-accent">Nail It.</span></h1>
        <p className="home-subtitle">
          Proactive Property Care for Rome Homeowners &amp; Landlords.
        </p>
        <p className="home-tagline">
          Because &ldquo;Sort of fixed it&rdquo; just isn&rsquo;t a good business model.
        </p>
      </section>

      <section className="home-why reveal">
        <h2>Stop Waiting for Things to Break.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Why wait for a catastrophic failure when you can prevent it? At Nailed
          It Property Solutions, we put your home maintenance on autopilot.
          Whether you&rsquo;re a busy homeowner protecting your investment or a
          landlord tired of midnight emergency calls, we&rsquo;ve got your upkeep
          nailed.
        </p> 
        <ul className="value-props">
          <li>
            <strong>Predictable Pricing</strong> No hidden fees & no
            surprise service charges.
          </li>
          <li>
            <strong>Neighborly Service:</strong> Local expertise with professional experience in the field.
          </li>
          <li>
            <strong>Preventative First:</strong> We catch the $100 problem before
            it becomes a $10,000 disaster.
          </li>
        </ul>
      </section>

      <section className="home-subscriptions reveal">
        <h2>Maintenance Subscriptions</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="subscriptions-intro">
          Starting at just $99/month. Our plans offer tiered coverage to fit your
          property&rsquo;s specific needs, ranging from baseline preventative care
          to comprehensive, labor-inclusive management.
        </p>

        <div className="plans-table-wrapper">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Plan Tier</th>
                <th>Key Focus</th>
                <th>Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>The Essential</strong></td>
                <td>Quarterly proactive care, HVAC health checks, and safety tests.</td>
                <td>Budget-conscious homeowners.</td>
              </tr>
              <tr>
                <td><strong>Premium Preservation</strong></td>
                <td>Quarterly interventions + exterior gutter cleaning, roof assessments, and appliance optimization.</td>
                <td>Proactive owners of older homes.</td>
              </tr>
              <tr>
                <td><strong>Elite Estate &amp; Investor</strong></td>
                <td>Monthly deep-dives, HVAC filter changes, and 1.5 hours of built-in handyman labor.</td>
                <td>Multi-property landlords &amp; high-end estates.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link to="/subscriptions" className="cta-button cta-button--secondary" style={{ marginTop: '32px' }}>
          See Full Plan Details
        </Link>
      </section>

      <section className="home-perks reveal">
        <h2>Subscriber Perks</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <ul className="perks-list">
          <li>
            <strong>Proactive Care:</strong> Routine inspections (HVAC, plumbing,
            safety) to catch issues early.
          </li>
          <li>
            <strong>VIP Priority:</strong> Subscribers skip the line. When you
            need us, you&rsquo;re at the front.
          </li>
          <li>
            <strong>Exclusive Discounts:</strong> Locked-in lower rates for
            custom repairs or upgrades.
          </li>
          <li>
            <strong>Transparent SLA:</strong> Guaranteed response times (down to
            4-hour emergency dispatch for Elite members).
          </li>
        </ul>
      </section>

      <section className="home-tenants reveal">
        <div className="tenants-content">
          <h2>Are You a Tenant?</h2>
          <div className="accent-bar" aria-hidden="true"></div>
          <p>
            Tired of waiting on repairs that never get done right? You deserve a
            well-maintained home. Let your landlord or property manager know about
            Nailed It Property Solutions — we make their job easier and your living
            situation better.
          </p>
          <p>
            Share this page with them, or <Link to="/contact">send us their info</Link> and
            we&rsquo;ll reach out on your behalf. Better maintenance benefits everyone.
          </p>
        </div>
      </section>

      <section className="home-referral reveal">
        <h2>Refer a Friend — You Both Get 1 Month Free</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Know someone whose property could use professional care? Refer them to
          Nailed It and when they sign up, you both earn a free month of service.
          It&rsquo;s our way of saying thanks for spreading the word.
        </p>
        <Link to="/contact" className="cta-button">
          Refer a Friend
        </Link>
        <p className="referral-disclaimer">
          *Referral must be a new client. Referred party must sign up on the same
          tier or greater to qualify. The first month&rsquo;s payment cannot be counted
          toward the free month. You will receive your third month free, provided
          both parties remain active subscribers at that time.
        </p>
      </section>

      <section className="home-straight-talk reveal">
        <h2>One-Off Repairs. Best Price in Town.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Not ready for a subscription? No problem. We handle single repairs and
          projects at flat-rate pricing that beats the competition. We price match
          local contractors — bring us a quote and we&rsquo;ll meet or beat it.
          Quality work shouldn&rsquo;t cost you more just because you called the
          right guy.
        </p>
      </section>

      <section className="home-testimonials reveal">
        <h2>What Clients Are Saying</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-stars">★★★★★</p>
            <p className="testimonial-text">
              &ldquo;Charles replaced our water heater the same day we called.
              Fair price, clean work, and he even cleaned up after himself.&rdquo;
            </p>
            <p className="testimonial-author">— Marcus T.</p>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-stars">★★★★★</p>
            <p className="testimonial-text">
              &ldquo;We had three different contractors ghost us before finding
              Nailed It. Charles showed up on time and did the work right.&rdquo;
            </p>
            <p className="testimonial-author">— Sandra &amp; Bill H.</p>
          </div>
        </div>
        <Link to="/reviews" className="cta-button cta-button--secondary" style={{ marginTop: '28px' }}>
          Read All Reviews
        </Link>
      </section>

      <section className="home-cta reveal">
        <h2>Take the Hammer Out of Your Hands.</h2>
        <p>
          Ready to stop worrying about your &ldquo;to-do&rdquo; list? Let&rsquo;s
          get your maintenance on the schedule.
        </p>
        <Link to="/contact" className="cta-button">
          Get Started
        </Link>
      </section>
    </div>
  );
}

export default Home;
