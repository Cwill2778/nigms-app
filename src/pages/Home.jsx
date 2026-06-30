import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import NameYourPrice from '../components/NameYourPrice';
import portrait from '../assets/charlesImg.jpg';
import './Home.css';

const fallbackTestimonials = [
  { stars: 5, text: 'Charles is proactive and very detail oriented. He has helped cure my landlord woes.', name: 'Charlie Ford' },
  { stars: 5, text: 'They are very thorough and know their business. I would recommend them to anyone needing home repairs.', name: 'Shane Cronan' },
  { stars: 5, text: 'Charles replaced our water heater the same day we called. Fair price for such a rapid response.', name: 'Marcus Thompson' },
  { stars: 5, text: 'We had three different contractors ghost us before finding Nailed It. Charles showed up, gave us an honest quote, and did the work right.', name: 'Sandra & Bill Henderson' },
  { stars: 5, text: "The drywall finish in our kitchen looks really great. You can't even tell where the old damage was.", name: 'David Reynolds' },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    supabase.from('reviews').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setTestimonials(data); });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % testimonials.length), 10000);
    return () => clearInterval(interval);
  }, [testimonials]);

  return (
    <div className="testimonial-carousel">
      {testimonials.map((t, i) => (
        <div className={`testimonial-slide${i === current ? ' testimonial-slide--active' : ''}`} key={i}>
          <p className="testimonial-stars">{'★'.repeat(t.stars)}</p>
          <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
          <p className="testimonial-author">— {t.name}</p>
        </div>
      ))}
      <div className="testimonial-dots">
        {testimonials.map((_, i) => (
          <button key={i} className={`testimonial-dot${i === current ? ' testimonial-dot--active' : ''}`} onClick={() => setCurrent(i)} aria-label={`View review ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function Home() {
  useScrollReveal();
  usePageMeta(
    'Property Maintenance and Emergency Repairs Rome, GA | Nailed It Property Solutions',
    'Nailed It Property Solutions offers expert property maintenance, repairs, emergency calls, unit turnovers, and home repair services for homeowners and landlords in Rome, GA. Call today!'
  );

  return (
    <div className="home">
      {/* Call Banner */}
      <a href="tel:+17068448193" className="scrolling-banner" aria-label="Call us now">
        <div className="banner-track">
          <span>CLICK HERE TO CALL US NOW — <strong className="banner-phone">(706) 844-8193</strong></span>
        </div>
      </a>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Don&rsquo;t Just Fix It. <span className="hero-accent">Nail It.</span></h1>
          <p className="home-subtitle">Proactive Property Care &amp; Home Repairs for Rome, GA.</p>
          <p className="home-tagline">Because &ldquo;Sort of fixed it&rdquo; just isn&rsquo;t a good business model.</p>
          <div className="hero-paths">
            <Link to="/homeowners" className="cta-button">I&rsquo;m a Homeowner &rarr;</Link>
            <Link to="/landlords" className="cta-button cta-button--secondary">I&rsquo;m a Landlord &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="home-trust">
        <div className="trust-items">
          <div className="trust-item">
            <span className="trust-icon">🛡️</span>
            <span>Licensed &amp; Insured</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✅</span>
            <span>Nailed It Guarantee</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">⏱️</span>
            <span>2-Hour Arrival Window</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">📱</span>
            <span>30-Min Text Before Arrival</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🟢</span>
            <span>Open 24/7</span>
          </div>
        </div>
      </section>

      {/* Owner Bio — visible without click */}
      <section className="home-owner reveal">
        <div className="owner-visible">
          <img src={portrait} alt="Charles Willis, Owner" className="owner-portrait" width="200" height="250" />
          <div className="owner-message">
            <h2>Meet the Man Behind the Hammer</h2>
            <div className="accent-bar" aria-hidden="true"></div>
            <p>
              &ldquo;When I started Nailed It Property Solutions, I wanted to build
              something different: a service that local homeowners and property
              managers could truly rely on. I know how stressful it can be to invite
              someone into your space, which is why my promise to you is simple: we
              treat every property like our own, ensuring every fix, patch, and
              installation stands the test of time.
            </p>
            <p>
              Whether you need a quick repair or a major update, you can expect
              clear communication and absolute respect for your
              home from the moment we arrive.&rdquo;
            </p>
            <p className="owner-signature">
              — Charles Willis<br />
              <span>Owner, Nailed It Property Solutions</span>
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="home-problem reveal" id="homeowners">
        <h2>Finding a Reliable Repairman Shouldn&rsquo;t Be This Hard.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          You call three contractors. One ghosts you. One shows up late with no quote.
          The third gives you a price that doubles halfway through the job. Sound familiar?
        </p>
        <p>
          We built Nailed It because Rome homeowners deserve better. Show up on time.
          Give an honest price. Do the work right. It really is that simple &mdash; and
          that&rsquo;s exactly what we do, every single time.
        </p>
      </section>

      {/* Featured Reviews */}
      <section className="home-featured-reviews reveal">
        <h2>Real Stories from Real Customers</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="featured-reviews-grid">
          <div className="featured-review">
            <p className="testimonial-stars">★★★★★</p>
            <p className="featured-review-text">
              &ldquo;We had three different contractors ghost us before finding Nailed It.
              Charles showed up, gave us an honest quote, and did the work right.&rdquo;
            </p>
            <p className="featured-review-author">— Sandra &amp; Bill Henderson</p>
          </div>
          <div className="featured-review">
            <p className="testimonial-stars">★★★★★</p>
            <p className="featured-review-text">
              &ldquo;Charles replaced our water heater the same day we called. Fair price
              for such a rapid response. We&rsquo;re signing up for the subscription plan.&rdquo;
            </p>
            <p className="featured-review-author">— Marcus Thompson</p>
          </div>
        </div>
        <Link to="/reviews" className="cta-button cta-button--secondary" style={{ marginTop: '24px' }}>
          Read All Reviews &rarr;
        </Link>
      </section>

      {/* Crisis Section */}
      <section className="home-crisis reveal">
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

      {/* Name Your Price — now AFTER trust-building */}
      <section className="home-form-section reveal">
        <h2>Ready? Tell Us What You Need.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="form-intro">Set your budget and describe the job. We&rsquo;ll get back to you with an honest assessment.</p>
        <NameYourPrice />
      </section>

      {/* Landlord / Property Manager Path */}
      <section className="home-landlord reveal" id="landlords">
        <h2>Property Managers &amp; Landlords: We Built This for You.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="landlord-intro">
          Managing rentals in Rome shouldn&rsquo;t mean juggling unreliable contractors.
          Our monthly subscription plans give you predictable costs, priority response,
          and a single point of contact for everything your properties need.
        </p>
        <div className="landlord-tiers">
          <div className="landlord-tier">
            <h3>Essential — $99/mo</h3>
            <p>Bi-annual maintenance, compliance checks, tenant portal, annual property report.</p>
          </div>
          <div className="landlord-tier landlord-tier--popular">
            <span className="tier-badge">Most Popular</span>
            <h3>Proactive — $199/mo</h3>
            <p>Quarterly visits, 2 hrs handyman labor/month, 48-hour guaranteed response, bi-annual reports.</p>
          </div>
          <div className="landlord-tier">
            <h3>Comprehensive — $399/mo</h3>
            <p>Monthly check-ins, 5 hrs labor/month, 24-hour emergency dispatch, trade coordination, quarterly reports.</p>
          </div>
        </div>
        <div className="landlord-proof">
          <p className="testimonial-stars">★★★★★</p>
          <p>&ldquo;Charles is proactive and very detail oriented. He has helped cure my landlord woes.&rdquo;</p>
          <p className="featured-review-author">— Charlie Ford</p>
        </div>
        <div className="landlord-ctas">
          <Link to="/services" className="cta-button">See Full Plan Details &rarr;</Link>
          <Link to="/contact" className="cta-button cta-button--secondary">Contact Us to Subscribe &rarr;</Link>
        </div>
      </section>

      {/* More Testimonials */}
      <section className="home-testimonials reveal">
        <h2>Don&rsquo;t Take Our Word for It.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <TestimonialCarousel />
      </section>

      {/* Final CTA */}
      <section className="home-cta reveal">
        <h2>Take the Hammer Out of Your Hands.</h2>
        <p>Ready to stop worrying about your to-do list? Let us handle it.</p>
        <div className="hero-paths">
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

export default Home;
