import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './NameYourPrice.css';

const MIN_PRICE = 55;
const MAX_PRICE = 2499;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const TOTAL_STEPS = 4;

function NameYourPrice() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [materialsSupplied, setMaterialsSupplied] = useState('customer');
  const [price, setPrice] = useState(250);
  const [priceInput, setPriceInput] = useState('250');
  const [files, setFiles] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function next() {
    setError('');
    if (step === 0 && !description.trim()) {
      setError('Please describe what you need done.');
      return;
    }
    if (step === 2 && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (step === 2 && !phone.trim() && !email.trim()) {
      setError('Please provide a phone number or email so we can respond to your offer.');
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

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
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError('');
    if (!description.trim()) {
      setError('Please describe what you need done.');
      setStep(0);
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      setStep(2);
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError('Please provide a phone number or email so we can respond to your offer.');
      setStep(2);
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the terms to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const attachmentPaths = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('nyp-attachments')
          .upload(path, file);
        if (!uploadError) {
          attachmentPaths.push(path);
        } else {
          console.warn('File upload failed:', uploadError.message);
        }
      }

      const { error: insertError } = await supabase.from('name_your_price').insert({
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        description: description.trim(),
        offered_price: price * 100,
        materials_supplied_by: materialsSupplied,
        attachments: attachmentPaths.length > 0 ? attachmentPaths : [],
        terms_accepted: true,
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again or call us directly.');
      console.error('NYP submission error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="nyp-section" id="name-your-price">
        <div className="nyp-success">
          <h2>Submission Received!</h2>
          <p>We&rsquo;ll review your request and get back to you shortly.</p>
          <button className="cta-button" onClick={() => { setSubmitted(false); setStep(0); setName(''); setPhone(''); setEmail(''); setDescription(''); setMaterialsSupplied('customer'); setPrice(250); setPriceInput('250'); setFiles([]); setTermsAccepted(false); }}>
            Submit Another
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
          <p className="nyp-subtitle">Tell us what you need. Set your budget. We&rsquo;ll make it happen.</p>
        </div>

        {/* Progress dots */}
        <div className="nyp-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`nyp-dot${i === step ? ' nyp-dot--active' : ''}${i < step ? ' nyp-dot--done' : ''}`} />
          ))}
        </div>

        {/* Step slides */}
        <div className="nyp-steps-wrapper">
          <div className="nyp-step" style={{ display: step === 0 ? 'block' : 'none' }}>
            <label className="nyp-step-label" htmlFor="nyp-desc">What do you need done?</label>
            <textarea
              id="nyp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work — be as specific as possible."
              rows={3}
            />
            <div className="nyp-materials">
              <label className="nyp-step-label">Who is supplying materials/fixtures?</label>
              <div className="nyp-materials-options">
                <label className={`nyp-material-option${materialsSupplied === 'customer' ? ' nyp-material-option--active' : ''}`}>
                  <input type="radio" name="materials" value="customer" checked={materialsSupplied === 'customer'} onChange={() => setMaterialsSupplied('customer')} />
                  <span>I&rsquo;ll supply them</span>
                </label>
                <label className={`nyp-material-option${materialsSupplied === 'nailedit' ? ' nyp-material-option--active' : ''}`}>
                  <input type="radio" name="materials" value="nailedit" checked={materialsSupplied === 'nailedit'} onChange={() => setMaterialsSupplied('nailedit')} />
                  <span>Nailed It supplies</span>
                </label>
                <label className={`nyp-material-option${materialsSupplied === 'unsure' ? ' nyp-material-option--active' : ''}`}>
                  <input type="radio" name="materials" value="unsure" checked={materialsSupplied === 'unsure'} onChange={() => setMaterialsSupplied('unsure')} />
                  <span>Not sure yet</span>
                </label>
              </div>
            </div>
          </div>

          <div className="nyp-step" style={{ display: step === 1 ? 'block' : 'none' }}>
            <label className="nyp-step-label">What&rsquo;s your budget?</label>
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
            />
            <div className="nyp-price-range">
              <span>${MIN_PRICE}</span>
              <span>${MAX_PRICE}</span>
            </div>
          </div>

          <div className="nyp-step" style={{ display: step === 2 ? 'block' : 'none' }}>
            <label className="nyp-step-label">How can we reach you?</label>
            <p className="nyp-contact-hint">Provide at least one so we can respond to your offer.</p>
            <div className="nyp-contact-fields">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            </div>
          </div>

          <div className="nyp-step" style={{ display: step === 3 ? 'block' : 'none' }}>
            <label className="nyp-step-label">Add photos or video (optional)</label>
            <div className="nyp-upload-area" onClick={() => fileInputRef.current?.click()}>
              <p>Tap to upload</p>
              <p className="nyp-upload-hint">Up to 5 files, 25MB each</p>
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
                    <span>{f.name.length > 25 ? f.name.substring(0, 22) + '...' : f.name}</span>
                    <button type="button" onClick={() => removeFile(i)}>&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="nyp-terms-inline">
              <label className="nyp-checkbox-label">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                <span>I accept the <Link to="/terms#name-your-price-terms">Terms of Use</Link></span>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="nyp-error">{error}</p>}

        {/* Navigation */}
        <div className="nyp-nav">
          {step > 0 && (
            <button type="button" className="nyp-back-btn" onClick={back}>Back</button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button type="button" className="cta-button nyp-next-btn" onClick={next}>Next</button>
          ) : (
            <button type="button" className="cta-button nyp-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Offer'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default NameYourPrice;
