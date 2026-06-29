import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './NameYourPrice.css';

const MIN_PRICE = 55;
const MAX_PRICE = 2499;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function NameYourPrice() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(250);
  const [priceInput, setPriceInput] = useState('250');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleSliderChange(e) {
    const val = parseInt(e.target.value);
    setPrice(val);
    setPriceInput(val.toString());
  }

  function handlePriceInput(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setPriceInput(raw);
    const val = parseInt(raw) || MIN_PRICE;
    setPrice(Math.min(Math.max(val, MIN_PRICE), MAX_PRICE));
  }

  function handlePriceBlur() {
    const clamped = Math.min(Math.max(parseInt(priceInput) || MIN_PRICE, MIN_PRICE), MAX_PRICE);
    setPrice(clamped);
    setPriceInput(clamped.toString());
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!description.trim()) { setError('Please describe what you need done.'); return; }
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.trim() && !email.trim()) { setError('Please add a phone number or email so we can reach you.'); return; }

    setSubmitting(true);
    try {
      const attachmentPaths = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('nyp-attachments').upload(path, file);
        if (!uploadError) attachmentPaths.push(path);
      }

      const { error: insertError } = await supabase.from('name_your_price').insert({
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        description: description.trim(),
        offered_price: price * 100,
        attachments: attachmentPaths.length > 0 ? attachmentPaths : [],
        terms_accepted: true,
      });

      if (insertError) throw insertError;
      if (window.rkp) window.rkp('event', 'CONTACT');
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again or call us.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="nyp-section" id="name-your-price">
        <div className="nyp-success">
          <span className="nyp-success-icon">✓</span>
          <h2>We Got It!</h2>
          <p>We&rsquo;ll review your request and reach out shortly. If your price works, we&rsquo;ll get you scheduled.</p>
          <button className="cta-button" onClick={() => { setSubmitted(false); setName(''); setPhone(''); setEmail(''); setDescription(''); setPrice(250); setPriceInput('250'); setFiles([]); }}>
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="nyp-section" id="name-your-price">
      <div className="nyp-container">
        <h2 className="nyp-title">Name Your Price</h2>
        <p className="nyp-subtitle">Tell us what you need and what you&rsquo;d like to pay. No commitment.</p>

        <form className="nyp-form" onSubmit={handleSubmit}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you need done?"
            rows={3}
          />

          <div className="nyp-price-section">
            <label>Your budget</label>
            <div className="nyp-price-row">
              <span className="nyp-dollar">$</span>
              <input
                type="text"
                className="nyp-price-input"
                value={priceInput}
                onChange={handlePriceInput}
                onBlur={handlePriceBlur}
                inputMode="numeric"
              />
            </div>
            <input type="range" className="nyp-slider" min={MIN_PRICE} max={MAX_PRICE} step={5} value={price} onChange={handleSliderChange} />
            <div className="nyp-price-range"><span>${MIN_PRICE}</span><span>${MAX_PRICE}</span></div>
          </div>

          <div className="nyp-contact-row">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>

          <div className="nyp-upload-row">
            <button type="button" className="nyp-upload-btn" onClick={() => fileInputRef.current?.click()}>
              📎 Add Photo/Video
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={handleFileChange} style={{ display: 'none' }} />
            {files.length > 0 && <span className="nyp-file-count">{files.length} file{files.length > 1 ? 's' : ''} attached</span>}
          </div>

          {files.length > 0 && (
            <div className="nyp-file-list">
              {files.map((f, i) => (
                <span key={i} className="nyp-file-tag">{f.name.substring(0, 20)} <button type="button" onClick={() => removeFile(i)}>&times;</button></span>
              ))}
            </div>
          )}

          {error && <p className="nyp-error">{error}</p>}

          <button type="submit" className="cta-button nyp-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>

          <p className="nyp-terms-notice">By submitting, you agree to our <Link to="/terms#name-your-price-terms">Terms of Use</Link>.</p>
        </form>
      </div>
    </section>
  );
}

export default NameYourPrice;
