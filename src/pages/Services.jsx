import { useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import Lightbox from '../components/Lightbox';
import kitchenBefore from '../assets/HarveyKitchenWallBefore.jpg';
import kitchenAfter from '../assets/HarveyKitchenWallAfter.jpg';
import './Services.css';

function Services() {
  useScrollReveal();

  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="services">
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      <section className="services-intro reveal">
        <h1>What We Do</h1>
        <p>
          Straightforward property maintenance and repair services at fair,
          flat-rate prices. No hidden fees, no inflated quotes — just quality
          work you can count on.
        </p>
      </section>

      <section className="services-list reveal">
        <h2>Our Services</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="services-grid">
          <div className="service-card">
            <h3>Drywall &amp; Finishing</h3>
            <p>
              Sheetrock hanging, mudding, taping, and smooth finishes. Texture
              matching, patching, and custom built-in features.
            </p>
          </div>
          <div className="service-card">
            <h3>Interior Painting</h3>
            <p>
              Proper prep, clean lines, and finishes that hold up. We take our
              time so you don&rsquo;t have to repaint next year.
            </p>
          </div>
          <div className="service-card">
            <h3>Plumbing Repairs</h3>
            <p>
              Leaks, fixtures, water heaters, and general plumbing maintenance.
              We fix the problem, not just the symptom.
            </p>
          </div>
          <div className="service-card">
            <h3>Exterior &amp; Decks</h3>
            <p>
              Deck repair, pressure washing, siding, stairs, and outdoor spaces
              built to handle Georgia weather year after year.
            </p>
          </div>
          <div className="service-card">
            <h3>Window &amp; Door Replacement</h3>
            <p>
              Energy-efficient upgrades, proper frame repairs, and sealing done
              right. Better comfort, lower energy bills.
            </p>
          </div>
          <div className="service-card">
            <h3>General Property Repairs</h3>
            <p>
              Everything else that needs fixing. If it&rsquo;s broken or wearing
              out, we&rsquo;ll take care of it — fairly and honestly.
            </p>
          </div>
        </div>
      </section>

      <section className="services-showcase reveal">
        <h2>Recent Work</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="showcase-item">
          <div className="showcase-header">
            <h3>Kitchen Wall — Sheetrock &amp; Smooth Finish</h3>
            <span className="gallery-category">Drywall &amp; Finishing</span>
          </div>
          <p className="showcase-description">
            Full sheetrock installation with professional mud and a smooth finish,
            plus a custom built-in mini shelf. Done right, done once — that&rsquo;s
            how we believe every job should go.
          </p>
          <div className="before-after-images">
            <figure className="before">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: kitchenBefore, alt: 'Kitchen wall before — exposed framing' })}
                aria-label="View full image: Kitchen wall before"
              >
                <img src={kitchenBefore} alt="Kitchen wall before — exposed framing" width="400" height="280" />
              </button>
              <figcaption>Before</figcaption>
            </figure>
            <figure className="after">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: kitchenAfter, alt: 'Kitchen wall after — smooth sheetrock finish with built-in shelf' })}
                aria-label="View full image: Kitchen wall after"
              >
                <img src={kitchenAfter} alt="Kitchen wall after — smooth sheetrock finish with built-in shelf" width="400" height="280" />
              </button>
              <figcaption>After</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="services-cta reveal">
        <h2>Need Something Taken Care Of?</h2>
        <p>
          Tell us what&rsquo;s going on with your property. We&rsquo;ll give you an honest
          assessment and a fair price — no pressure, no obligation.
        </p>
        <Link to="/contact" className="cta-button">
          Get a Free Quote
        </Link>
      </section>
    </div>
  );
}

export default Services;
