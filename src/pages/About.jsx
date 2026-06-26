import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import Lightbox from '../components/Lightbox';
import portrait from '../assets/charlesImg.jpg';
import working1 from '../assets/CharlesWorking1.jpg';
import working2 from '../assets/CharlesWorking2.jpg';
import windowBefore from '../assets/TripleWindowsBefore.jpg';
import windowAfter from '../assets/TripleWindowsAfter.jpg';
import outdoorBefore from '../assets/OutdoorSittingAreaBefore.jpg';
import outdoorAfter from '../assets/OutdoorSittingAreaAfter.jpg';
import './About.css';

function About() {
  useScrollReveal();
  usePageMeta(
    'About Nailed It Property Solutions | Rome, GA Maintenance',
    "Learn about Nailed It Property Solutions, Rome, GA's trusted local partner for reliable residential repairs, preventative maintenance, and rental property upkeep."
  );

  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="about">
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      <section className="about-intro reveal">
        <h1>Meet the Man Behind the Hammer.</h1>
        <p className="about-tagline">
          &ldquo;Because &lsquo;sort of fixed it&rsquo; just isn&rsquo;t a good business model.&rdquo;
        </p>
      </section>

      <section className="about-portrait-section reveal">
        <div className="about-intro-content">
          <img
            src={portrait}
            alt="Charles Willis, owner of Nailed It Property Solutions"
            className="about-portrait"
            width="320"
            height="400"
          />
          <div className="about-message">
            <h2>A Personal Message to Our Clients</h2>
            <h3>A Note from the Owner</h3>
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
              home from the moment we arrive.
            </p>
            <p>
              Thank you for trusting us to care for your property right here in the
              Rome community. We look forward to working with you.&rdquo;
            </p>
            <p className="about-signature">
              — Charles Willis<br />
              <span>Owner, Nailed It Property Solutions</span>
            </p>
          </div>
        </div>
      </section>

      <section className="about-section reveal">
        <h2>The &ldquo;Nailed It&rdquo; Standard</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          The phrase &ldquo;nailed it&rdquo; might get thrown around casually these
          days—even stamped on the bottom of big-box hardware store receipts—but
          Charles takes the name personally. To him, it is not just a clever
          catchphrase; it is a rigid standard of quality. He believes that if you
          are going to use the phrase, you had better have the craftsmanship,
          integrity, and attentiveness to back it up.
        </p>
        <p>
          In an industry where it is all too common to see corners cut and quality
          sacrificed for a quick turnaround, Charles stands his ground. He has seen
          firsthand the long-term damage caused by band-aid fixes and contractors
          who prioritize a fast paycheck over honest work. Charles brings the
          endurance required to do things the right way—even when it means pushing
          back against doing things &ldquo;dirt cheap &amp; fast.&rdquo;
        </p>
      </section>

      <section className="about-section reveal">
        <h2>Peace of Mind Through Preventative Care</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          A house will eventually speak up if it is neglected. Charles&rsquo;s mission
          is to provide affordable, proactive care for your most expensive asset so
          you never have to face a 2:00 AM emergency because a hot water heater
          finally had enough. By meticulously paying attention to the small details
          today, Charles ensures you have the ultimate peace of mind tomorrow.
        </p>
        <p className="about-cta-text">Get your property nailed right.</p>
      </section>

      <section className="about-working reveal">
        <h2>Charles in Action</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="working-photos">
          <button
            className="photo-button"
            onClick={() => setLightbox({ src: working1, alt: 'Charles Willis working on a property' })}
            aria-label="View full image: Charles Willis working on a property"
          >
            <img src={working1} alt="Charles Willis working on a property" width="600" height="280" />
          </button>
          <button
            className="photo-button"
            onClick={() => setLightbox({ src: working2, alt: 'Charles Willis on another job site' })}
            aria-label="View full image: Charles Willis on another job site"
          >
            <img src={working2} alt="Charles Willis on another job site" width="600" height="280" />
          </button>
        </div>
        <h3 className="experience-heading">Past Experience</h3>
        <div className="before-after-set">
          <h4 className="before-after-title">Triple Window Replacement</h4>
          <span className="gallery-category">Window Installation</span>
          <div className="before-after-images">
            <figure className="before">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: windowBefore, alt: 'Triple windows before replacement' })}
                aria-label="View full image: Triple windows before replacement"
              >
                <img src={windowBefore} alt="Triple windows before replacement" width="400" height="260" />
              </button>
              <figcaption>Before</figcaption>
            </figure>
            <figure className="after">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: windowAfter, alt: 'Triple windows after replacement' })}
                aria-label="View full image: Triple windows after replacement"
              >
                <img src={windowAfter} alt="Triple windows after replacement" width="400" height="260" />
              </button>
              <figcaption>After</figcaption>
            </figure>
          </div>
        </div>
        <div className="before-after-set">
          <h4 className="before-after-title">Outdoor Sitting Area</h4>
          <span className="gallery-category">Exterior Renovation</span>
          <div className="before-after-images">
            <figure className="before">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: outdoorBefore, alt: 'Outdoor sitting area before' })}
                aria-label="View full image: Outdoor sitting area before"
              >
                <img src={outdoorBefore} alt="Outdoor sitting area before" width="400" height="260" />
              </button>
              <figcaption>Before</figcaption>
            </figure>
            <figure className="after">
              <button
                className="photo-button"
                onClick={() => setLightbox({ src: outdoorAfter, alt: 'Outdoor sitting area after' })}
                aria-label="View full image: Outdoor sitting area after"
              >
                <img src={outdoorAfter} alt="Outdoor sitting area after" width="400" height="260" />
              </button>
              <figcaption>After</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="about-section about-personal reveal">
        <h2>Off the Clock</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          When he is not actively protecting and improving his clients&rsquo;
          properties, Charles can still be found working with his hands. He loves
          spending his free time outdoors, continuously taming and developing his
          own ever-so-muddy yard at home.
        </p>
      </section>

      <section className="about-section about-local reveal">
        <h2>Live & Breath Rome, Georgia 24 hrs a day | 7 days a week.</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <p>
          This isn&rsquo;t just where we work — it&rsquo;s home. Charles knows the
          quirks of Rome&rsquo;s housing stock: the older brick bungalows in West Rome
          that need seasonal gutter attention, the mid-century rentals along North Broad
          with their aging plumbing, the humidity challenges in South Rome properties
          near the river, and the historic character homes around Clocktower Hill that
          deserve restoration, not shortcuts.
        </p>
        <p>
          When you call Nailed It, you&rsquo;re not explaining where you live to
          someone checking a GPS. You&rsquo;re talking to a neighbor who already
          knows the neighborhood, the building codes, and what the local hardware
          store actually has in stock.
        </p>
      </section>
    </div>
  );
}

export default About;
