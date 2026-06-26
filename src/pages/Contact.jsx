import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import './Contact.css';

function Contact() {
  useScrollReveal();
  usePageMeta(
    'Contact Nailed It Property Solutions | Rome, GA Repairs',
    'Need reliable property maintenance or emergency repairs in Rome, GA? Contact Nailed It Property Solutions today to get a quote or schedule a service.'
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Save to Supabase for admin dashboard
    supabase.from('contact_submissions').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      interest: formData.interest,
      message: formData.message,
    }).then();

    // Roku Pixel: Contact event
    if (window.rkp) window.rkp('event', 'CONTACT');

    // Also send via Formspree for email notifications
    fetch('https://formspree.io/f/xqeooyyl', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.ok) {
          alert('Thank you! We will be in touch shortly.');
          setFormData({ name: '', email: '', phone: '', interest: '', message: '' });
        } else {
          alert('Something went wrong. Please try again.');
        }
      })
      .catch(() => alert('Something went wrong. Please try again.'));
  };

  return (
    <div className="contact">
      <section className="contact-intro reveal">
        <h1>We&rsquo;re Here to Help.</h1>
        <p>
          Serving Rome, GA (30161 &amp; 30165) — honest work, fair prices, and a
          team that actually picks up the phone.
        </p>
      </section>

      <section className="contact-content">
        <div className="contact-info reveal">
          <h2>Contact Information</h2>
          <div className="accent-bar" aria-hidden="true"></div>

          <div className="info-block">
            <h3>Office Phone</h3>
            <a href="tel:+17068448193">(706) 844-8193</a>
          </div>

          <div className="info-block">
            <h3>Direct Line (Charles)</h3>
            <a href="tel:+17068448059">(706) 844-8059</a>
          </div>

          <div className="info-block">
            <h3>Emergency Email</h3>
            <a href="mailto:support.nailedit@gmail.com">support.nailedit@gmail.com</a>
          </div>

          <div className="info-block">
            <h3>Mailing Address</h3>
            <address>
              PO Box 53<br />
              Rome, GA 30162
            </address>
          </div>

          <div className="info-block">
            <h3>Business Hours</h3>
            <table className="hours-table">
              <tbody>
                <tr>
                  <td>Monday – Friday</td>
                  <td>9:30 AM – 5:30 PM</td>
                </tr>
                <tr>
                  <td>Saturday – Sunday</td>
                  <td>Open 24 Hours</td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontStyle: 'italic', paddingTop: '8px' }}>
                    We know your weekends are your only real time to get things handled. We&rsquo;re available when it works for you.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="info-block">
            <h3>Service Area</h3>
            <p>Rome, GA — ZIP codes 30161 &amp; 30165</p>
          </div>
        </div>

        <div className="contact-form-wrapper reveal">
          <h2>Send Us a Message</h2>
          <div className="accent-bar" aria-hidden="true"></div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="interest">I&apos;m Interested In</label>
              <select
                id="interest"
                name="interest"
                value={formData.interest}
                onChange={handleChange}
                required
              >
                <option value="">Select an option</option>
                <option value="subscriptions">Property Maintenance Subscription</option>
                <option value="turnovers">Unit Turnover Services</option>
                <option value="both">Both</option>
                <option value="other">Something Else</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="cta-button">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Contact;
