import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import NameYourPrice from '../components/NameYourPrice';
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
    'Nailed It Property Solutions offers expert property maintenance, repairs, emergency calls, unit turnovers, and home repair services for homeowners in Rome, GA. Call today!'
  );

  return (
    <div className="home">
      {/* Call Banner */}
      <a href="tel:+17068448193" className="scrolling-banner" aria-label="Call us now">
        <div className="banner-track">
          <span>CLICK HERE TO CALL US NOW — <strong className="banner-phone">(706) 844-8193</strong></span>
        </div>
      </a>

      {/* Hero + Name Your Price */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Don&rsquo;t Just Fix It. <span className="hero-accent">Nail It.</span></h1>
          <p className="home-subtitle">Proactive Property Care &amp; Home Repairs for Rome, GA Residents.</p>
          <p className="home-tagline">Because &ldquo;Sort of fixed it&rdquo; just isn&rsquo;t a good business model.</p>
        </div>
        <NameYourPrice />
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
        </div>
      </section>

      {/* The Problem */}
      <section className="home-problem reveal">
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
        <Link to="/services" className="cta-button">See Everything We Fix &rarr;</Link>
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

      {/* Service Areas */}
      <section className="home-service-areas reveal">
        <h2>Proudly Serving Every Corner of Rome</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p className="service-areas-intro">
          We live here, work here, and know every neighborhood. Not a franchise. Not an app. Your neighbor.
        </p>
        <div className="service-areas-grid">
          <div className="area-card">
            <h3>Downtown Rome</h3>
            <p className="area-tagline">&ldquo;Keeping Broad Street Beautiful.&rdquo;</p>
            <p>Century-old brick and mortar demands specialized care. We understand the unique needs of Downtown&rsquo;s historic properties.</p>
          </div>
          <div className="area-card">
            <h3>Clocktower Hill</h3>
            <p className="area-tagline">&ldquo;Preserving the View from Neely Hill.&rdquo;</p>
            <p>Steep drives, older foundations, and historic charm. We handle the specialized maintenance for Rome&rsquo;s most iconic neighborhood.</p>
          </div>
          <div className="area-card">
            <h3>East Rome</h3>
            <p className="area-tagline">&ldquo;Protecting the Charm Under the Oaks.&rdquo;</p>
            <p>Beautiful mature trees mean roof debris and clogged gutters. We handle the heavy seasonal maintenance year-round.</p>
          </div>
          <div className="area-card">
            <h3>West Rome</h3>
            <p className="area-tagline">&ldquo;Your Coosa Valley Maintenance Crew.&rdquo;</p>
            <p>River humidity and busy traffic wear. We&rsquo;re right around the corner with proactive solutions.</p>
          </div>
          <div className="area-card">
            <h3>North Rome</h3>
            <p className="area-tagline">&ldquo;More Space Shouldn&rsquo;t Mean More Stress.&rdquo;</p>
            <p>Newer builds and sprawling properties out toward Armuchee. We take preventative maintenance off your plate.</p>
          </div>
          <div className="area-card">
            <h3>South Rome</h3>
            <p className="area-tagline">&ldquo;Hardworking Care for Hardworking Homes.&rdquo;</p>
            <p>From Lindale&rsquo;s mill town roots to the banks of the Etowah. Dependable, no-nonsense maintenance.</p>
          </div>
        </div>
        <Link to="/contact" className="cta-button">Get a Free Quote for Your Neighborhood &rarr;</Link>
      </section>

      {/* Testimonials */}
      <section className="home-testimonials reveal">
        <h2>Don&rsquo;t Take Our Word for It.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <TestimonialCarousel />
        <Link to="/reviews" className="cta-button cta-button--secondary" style={{ marginTop: '24px' }}>
          Read All Reviews &rarr;
        </Link>
      </section>

      {/* Referral */}
      <section className="home-referral reveal">
        <h2>Refer a Friend — You Both Get 1 Month Free</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          Know someone whose property could use professional care? Refer them to
          Nailed It and when they sign up, you both earn a free month of service.
        </p>
        <Link to="/contact" className="cta-button">Refer a Friend &rarr;</Link>
      </section>

      {/* Final CTA */}
      <section className="home-cta reveal">
        <h2>Take the Hammer Out of Your Hands.</h2>
        <p>Ready to stop worrying about your to-do list? Let us handle it.</p>
        <a href="#name-your-price" className="cta-button">Name Your Price &rarr;</a>
      </section>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-action-bar">
        <a href="tel:+17062378184" className="action-btn action-btn--call">📞 Call Now</a>
        <a href="sms:+17068448193" className="action-btn action-btn--text">💬 Text Us</a>
      </div>
    </div>
  );
}

export default Home;
