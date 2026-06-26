import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import romeBroadSt from '../assets/romeBroadStSign.jpeg';
import bridgeRome from '../assets/bridgeRome.jpg';
import miniBar from '../assets/miniBar.jpg';
import NameYourPrice from '../components/NameYourPrice';
import './Home.css';

const fallbackTestimonials = [
  { stars: 5, text: 'Charles is proactive and very detail oriented. He has helped cure my landlord woes.', name: 'Charlie Ford' },
  { stars: 5, text: 'They are very thorough and know their business. I would recommend them to anyone needing home repairs. They have the knowledge and can build anything, even a house from the ground up.', name: 'Shane Cronan' },
  { stars: 5, text: 'Charles replaced our water heater the same day we called. Fair price for such a rapid response. Will be signing up for the subscription plan.', name: 'Marcus Thompson' },
  { stars: 5, text: 'We had three different contractors ghost us before finding Nailed It. Charles showed up, gave us an honest quote, and did the work right. No surprises on the bill.', name: 'Sandra & Bill Henderson' },
  { stars: 5, text: "The drywall finish in our kitchen looks really great. You can't even tell where the old damage was. Great attention to detail.", name: 'David Reynolds' },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [testimonials]);

  return (
    <section className="home-testimonials reveal">
      <h2>What Clients Are Saying</h2>
      <div className="accent-bar" aria-hidden="true"></div>
      <div className="testimonial-carousel">
        {testimonials.map((t, i) => (
          <div
            className={`testimonial-slide${i === current ? ' testimonial-slide--active' : ''}`}
            key={i}
          >
            <p className="testimonial-stars">{'★'.repeat(t.stars)}</p>
            <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
            <p className="testimonial-author">— {t.name}</p>
          </div>
        ))}
      </div>
      <div className="testimonial-dots">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`testimonial-dot${i === current ? ' testimonial-dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`View review ${i + 1}`}
          />
        ))}
      </div>
      <Link to="/reviews" className="cta-button cta-button--secondary" style={{ marginTop: '24px' }}>
        Read All Reviews
      </Link>
    </section>
  );
}

function Home() {
  useScrollReveal();
  usePageMeta(
    'Property Maintenance and Emergency Repairs Rome, GA | Nailed It Property Solutions',
    'Nailed It Property Solutions offers expert property maintenance, repairs, emergency calls, unit turnovers, and home repair services for homeowners in Rome, GA. Call today!'
  );

  return (
    <div className="home">
      <a href="tel:+17068448193" className="scrolling-banner" aria-label="Call us now">
        <div className="banner-track">
          <span>CLICK HERE TO CALL US NOW — <strong className="banner-phone">(706) 844-8193</strong></span>
        </div>
      </a>

      <section className="home-hero" style={{ backgroundImage: `url(${miniBar})` }}>
        <div className="home-hero-overlay"></div>
        <div className="home-hero-text">
          <h1>Don&rsquo;t Just Fix It. <span className="hero-accent">Nail It.</span></h1>
          <p className="home-subtitle">
            Proactive Property Care &amp; Home Repairs for Rome, GA Residents.
          </p>
          <p className="home-tagline">
            Because &ldquo;Sort of fixed it&rdquo; just isn&rsquo;t a good business model.
          </p>
        </div>
        <NameYourPrice />
      </section>

      <section className="home-why reveal">
        <h2>Stop Waiting for Things to Break.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="home-why-content">
          <img
            src={bridgeRome}
            alt="Historic bridge in downtown Rome, Georgia"
            className="home-community-img"
            width="400"
            height="267"
          />
          <div>
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
          </div>
        </div>
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
        <h2>No Membership Required.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          You don&rsquo;t need a subscription to get top-quality work from us.
          Every client gets the same level of craftsmanship, attention to detail,
          and honest pricing — whether it&rsquo;s a one-time repair or a full
          renovation. Our preventative maintenance plans are there if you want
          extra peace of mind and priority scheduling, but they&rsquo;re never a
          requirement. Need something fixed? Just call.
        </p>
      </section>

      <section className="home-repairs reveal">
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

      <section className="home-service-areas reveal">
        <h2>Proudly Serving Every Corner of Rome</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="service-areas-intro">
          We&rsquo;re not a faceless franchise dispatching from Atlanta. We live here,
          work here, and know the unique character of every neighborhood in Rome, GA.
        </p>
        <div className="service-areas-grid">
          <div className="area-card">
            <h3>Downtown Rome</h3>
            <p className="area-tagline">&ldquo;Keeping Broad Street Beautiful.&rdquo;</p>
            <p>Whether you&rsquo;re managing a bustling storefront or a historic loft, we understand the unique demands of maintaining Downtown Rome&rsquo;s century-old brick and mortar. Let us handle the upkeep so you can focus on the heartbeat of the city.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Masonry tuckpointing and brickwork touch-ups, commercial-grade HVAC filter rotation, high-traffic flooring repairs, and updated fixture installations for modern lofts.</p>
          </div>
          <div className="area-card">
            <h3>Clocktower Hill</h3>
            <p className="area-tagline">&ldquo;Preserving the View from Neely Hill.&rdquo;</p>
            <p>Steep drives, older foundations, and historic charm require a specific, careful touch. We handle the specialized maintenance for Rome&rsquo;s most iconic neighborhood so you can just sit back and enjoy the view.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Retaining wall stabilization, historic window weatherstripping, minor foundation crack sealing, and custom deck or balcony safety reinforcements.</p>
          </div>
          <div className="area-card">
            <h3>East Rome</h3>
            <p className="area-tagline">&ldquo;Protecting the Charm Under the Oaks.&rdquo;</p>
            <p>East Rome is famous for its beautiful, mature trees — and the roof debris and clogged gutters that come with them. We handle the heavy seasonal maintenance to keep your classic East Rome property looking pristine year-round.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Complete gutter clearing and guard installation, wood rot repair on fascia and eaves, exterior soft-washing, and deck sealing to combat organic buildup.</p>
          </div>
          <div className="area-card">
            <h3>West Rome</h3>
            <p className="area-tagline">&ldquo;Your Coosa Valley Maintenance Crew.&rdquo;</p>
            <p>From the busy traffic off Shorter Avenue to the river humidity, West Rome properties face their own kind of weather and wear. We&rsquo;re right around the corner with proactive solutions to protect your investment.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Moisture and mildew remediation, vinyl and hardie siding panel repairs, heavy-duty HVAC coil cleaning, and seamless drywall patching.</p>
          </div>
          <div className="area-card">
            <h3>North Rome</h3>
            <p className="area-tagline">&ldquo;More Space Shouldn&rsquo;t Mean More Stress.&rdquo;</p>
            <p>Whether you&rsquo;re managing a newer build or a sprawling property out toward Armuchee, North Rome gives you room to breathe. We take the preventative maintenance off your plate so you can actually enjoy your weekends.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Perimeter fence mending, exterior trim repair, garage door hardware tune-ups, and modern smart-home fixture installations.</p>
          </div>
          <div className="area-card">
            <h3>South Rome</h3>
            <p className="area-tagline">&ldquo;Hardworking Care for Hardworking Homes.&rdquo;</p>
            <p>From the historic mill town roots of Lindale to the banks of the Etowah, South Rome was built on reliability. We bring that same dependable, no-nonsense approach to keeping your home&rsquo;s systems running perfectly.</p>
            <p className="area-repairs"><strong>How We Repair It:</strong> Porch and step carpentry reinforcement, aging plumbing fixture upgrades, subfloor patching, and reliable preventative maintenance for older home systems.</p>
          </div>
        </div>
        <p className="service-areas-tagline">
          If it&rsquo;s in Floyd County, we&rsquo;re there. <Link to="/contact">Contact us</Link> to
          confirm coverage for your specific area.
        </p>
      </section>

      <TestimonialCarousel />

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
