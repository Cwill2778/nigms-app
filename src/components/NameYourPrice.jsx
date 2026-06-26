import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './NameYourPrice.css';

const MIN_PRICE = 55;
const MAX_PRICE = 2499;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function NameYourPrice() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(250);
  const [priceInput, setPriceInput] = useState('250');
  const [files, setFiles] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    if (valid.length !== selected.length) {
      setError('Some files exceed 25MB and were excluded.');
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5)); // max 5 files
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !description.trim()) {
      setError('Please fill in your name and describe what you need.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the terms of use to continue.');
      return;
    }

    setSubmitting(true);

    try {
      // Upload files to storage
      const attachmentPaths = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('nyp-attachments')
          .upload(path, file);
        if (!uploadError) {
          attachmentPaths.push(path);
        }
      }

      // Insert submission
      const { error: insertError } = await supabase.from('name_your_price').insert({
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        description: description.trim(),
        offered_price: price * 100, // convert to cents
        attachments: attachmentPaths,
        terms_accepted: true,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="nyp-section" id="name-your-price">
        <div className="nyp-success">
          <h2>Submission Received!</h2>
          <p>We&rsquo;ll review your request and get back to you shortly. If your price works for the scope, we&rsquo;ll get you on the schedule.</p>
          <button className="cta-button" onClick={() => { setSubmitted(false); setName(''); setPhone(''); setEmail(''); setDescription(''); setPrice(250); setPriceInput('250'); setFiles([]); setTermsAccepted(false); }}>
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="nyp-section" id="name-your-price">
      <div className="nyp-container">
        <div className="nyp-header">
          <h2>Name Your Price</h2>
          <p className="nyp-subtitle">Tell us what you need done and what you&rsquo;re willing to pay. If it works, we&rsquo;ll get it scheduled.</p>
        </div>

        <form className="nyp-form" onSubmit={handleSubmit}>
          <div className="nyp-field">
            <label htmlFor="nyp-name">Your Name *</label>
            <input id="nyp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          </div>

          <div className="nyp-row">
            <div className="nyp-field">
              <label htmlFor="nyp-phone">Phone</label>
              <input id="nyp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(706) 555-0123" />
            </div>
            <div className="nyp-field">
              <label htmlFor="nyp-email">Email</label>
              <input id="nyp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          <div className="nyp-field">
            <label htmlFor="nyp-description">What Do You Need Done? *</label>
            <textarea id="nyp-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the work you need — be as specific as possible for a faster response." rows={4} required />
          </div>

          <div className="nyp-field nyp-price-field">
            <label>Your Offer</label>
            <div className="nyp-price-display">
              <span className="nyp-dollar">$</span>
              <input
                type="text"
                className="nyp-price-input"
                value={priceInput}
                onChange={handlePriceInput}
                onBlur={handlePriceBlur}
                inputMode="numeric"
                aria-label="Enter your price"
              />
            </div>
            <input
              type="range"
              className="nyp-slider"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={5}
              value={price}
              onChange={handleSliderChange}
              aria-label="Price slider"
            />
            <div className="nyp-price-range">
              <span>${MIN_PRICE}</span>
              <span>${MAX_PRICE}</span>
            </div>
          </div>

          <div className="nyp-field">
            <label>Photos or Video (optional, max 25MB each)</label>
            <div className="nyp-upload-area" onClick={() => fileInputRef.current?.click()}>
              <p>Click to upload or drag files here</p>
              <p className="nyp-upload-hint">Up to 5 files. JPEG, PNG, MP4, MOV accepted.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {files.length > 0 && (
              <div className="nyp-file-list">
                {files.map((f, i) => (
                  <div key={i} className="nyp-file-item">
                    <span>{f.name} ({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                    <button type="button" onClick={() => removeFile(i)} aria-label="Remove file">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nyp-field nyp-terms">
            <label className="nyp-checkbox-label">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span>I agree to the <a href="#nyp-terms-text">Terms of Use</a> and understand this is a request, not a guaranteed booking. Final pricing may vary based on inspection.</span>
            </label>
          </div>

          {error && <p className="nyp-error">{error}</p>}

          <button type="submit" className="cta-button nyp-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Your Offer'}
          </button>
        </form>

        <div className="nyp-terms-text" id="nyp-terms-text">
          <h4>Terms of Use</h4>
          <p>
            By submitting this form, you acknowledge that your offer is a request for service and does not
            constitute a binding agreement. Nailed It Property Solutions reserves the right to accept, counter,
            or decline any offer based on scope assessment. Final pricing may be adjusted after an on-site
            inspection if the actual work differs materially from the description provided. Submitted photos
            and videos are used solely for job assessment purposes.
          </p>
        </div>
      </div>
    </section>
  );
}

export default NameYourPrice;
