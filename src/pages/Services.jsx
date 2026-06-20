import { useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import Lightbox from '../components/Lightbox';
import kitchenBefore from '../assets/HarveyKitchenWallBefore.jpg';
import kitchenAfter from '../assets/HarveyKitchenWallAfter.jpg';
import './Services.css';

const serviceCategories = [
  {
    title: 'Property Maintenance Subscriptions',
    services: [
      'Preventative HVAC maintenance (filter swaps, health checks)',
      'Smoke & CO detector testing / battery replacement',
      'Gutter cleaning',
      'Visual property inspections (interior & exterior)',
      'Property management reports',
      'Priority tenant work order response',
      'Included monthly handyman labor hours',
      'Emergency dispatch',
      'Trade coordination (licensed specialist oversight)',
    ],
  },
  {
    title: 'Unit Turnover Services',
    services: [
      'Turnover assessment & scope building',
      'Paint touch-ups (walls, trim, baseboards)',
      'Floor cleaning (sweep & deep mop)',
      'Lock re-keying / replacement',
      'Odor neutralization & air freshener install',
      'Appliance & window functional audit',
      'Property securing & key hand-off',
      'Trash-out / junk removal',
    ],
  },
  {
    title: 'Drywall & Finishing',
    services: [
      'Sheetrock hanging & installation',
      'Mudding, taping & smooth finish',
      'Drywall patching (nail holes to large damage)',
      'Texture matching',
      'Custom built-in shelving & features',
    ],
  },
  {
    title: 'Interior Painting',
    services: [
      'Full room painting',
      'Trim & baseboard touch-ups',
      'Proper prep (sanding, priming, taping)',
      'Color matching',
    ],
  },
  {
    title: 'Plumbing Repairs',
    services: [
      'Leaking faucet repair / replacement',
      'Running toilet repair',
      'Water heater maintenance',
      'Fixture replacement',
      'General plumbing troubleshooting',
    ],
  },
  {
    title: 'Exterior & Decks',
    services: [
      'Deck repair & restoration',
      'Pressure washing',
      'Siding repair',
      'Stair replacement & repair',
      'Outdoor living space construction',
    ],
  },
  {
    title: 'Windows & Doors',
    services: [
      'Window replacement (single & multi-pane)',
      'Door replacement',
      'Frame repair',
      'Weathersealing & insulation',
      'Hardware adjustment & replacement',
    ],
  },
  {
    title: 'General Property Repairs',
    services: [
      'Cabinet hinge tightening & adjustment',
      'Light fixture replacement',
      'Blind replacement',
      'Minor carpentry (shelving, trim)',
      'Lightbulb replacement',
      'Anything else that\'s broken or wearing out',
    ],
  },
];

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
        <h1>Our Services</h1>
        <p>
          Straightforward property maintenance and repair services at fair,
          flat-rate prices. No hidden fees, no inflated quotes — just quality
          work you can count on.
        </p>
      </section>

      <section className="services-categories reveal">
        <h2>What We Offer</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="categories-grid">
          {serviceCategories.map((category, index) => (
            <div className="category-card" key={index}>
              <h3>{category.title}</h3>
              <ul>
                {category.services.map((service, sIndex) => (
                  <li key={sIndex}>{service}</li>
                ))}
              </ul>
            </div>
          ))}
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
