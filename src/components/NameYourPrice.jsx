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
              <span>I have read and agree to the <a href="#nyp-terms-text">Terms of Submission</a> and acknowledge that this is a request for negotiation, not a binding contract.</span>
            </label>
          </div>

          {error && <p className="nyp-error">{error}</p>}

          <button type="submit" className="cta-button nyp-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Your Offer'}
          </button>
        </form>

        <div className="nyp-terms-text" id="nyp-terms-text">
          <h4>Terms of Submission for &ldquo;Name Your Price&rdquo; Requests</h4>
          <p className="nyp-terms-updated">Last Updated: June 26, 2026</p>
          <p>
            By clicking &ldquo;Submit,&rdquo; &ldquo;Send Bid,&rdquo; or otherwise submitting this form, you (the &ldquo;Customer&rdquo;) expressly agree to the following terms and conditions set forth by Nailed It Property Solutions (the &ldquo;Company&rdquo;). Please read these terms carefully before submitting your request.
          </p>

          <h5>1. Nature of the Submission</h5>
          <p>
            <strong>1.1 Not a Binding Contract:</strong> The submission of this form, including any proposed price, job description, or uploaded media, does not constitute a binding legal agreement, a guaranteed contract, or a finalized bid for services.
          </p>
          <p>
            <strong>1.2 Initiation of Negotiation:</strong> This form serves strictly as an invitation to negotiate. It is a preliminary request designed to begin a discussion regarding potential home repair or maintenance services.
          </p>

          <h5>2. Review and Response Process</h5>
          <p>
            <strong>2.1 Right to Reject:</strong> Nailed It Property Solutions reserves the absolute right to reject any submitted price, project, or request at its sole discretion, without providing a reason or justification.
          </p>
          <p>
            <strong>2.2 Counter-Offers:</strong> The Company may, at its discretion, respond to your submission with a counter-offer. A counter-offer is a new proposal and does not bind either party until explicitly accepted in writing by both the Customer and the Company.
          </p>
          <p>
            <strong>2.3 No Guarantee of Service:</strong> Submitting a request does not guarantee that the Company has the scheduling availability, resources, or intent to complete the requested work.
          </p>

          <h5>3. Accuracy of Information and Scope of Work</h5>
          <p>
            <strong>3.1 Customer Responsibility:</strong> The Customer agrees to provide accurate, truthful, and complete information regarding the scope of work, property conditions, and any potential hazards.
          </p>
          <p>
            <strong>3.2 On-Site Verification:</strong> Any accepted bid, counter-offer, or preliminary agreement is entirely contingent upon an on-site physical inspection by a representative of Nailed It Property Solutions.
          </p>
          <p>
            <strong>3.3 Price Adjustments:</strong> If the actual scope of work, material requirements, or property conditions differ materially from the Customer&rsquo;s submitted description or uploaded media, the Company reserves the right to immediately withdraw any accepted bid or counter-offer and issue a revised estimate.
          </p>

          <h5>4. Subscription Tier Pricing (If Applicable)</h5>
          <p>
            If the Customer is an active subscriber to a Nailed It Property Solutions maintenance plan, any priority routing or exclusive discounts applied to the &ldquo;Name Your Price&rdquo; tool are contingent upon the Customer&rsquo;s account being in good standing at the time of both the submission and the completion of the work.
          </p>

          <h5>5. Limitation of Liability</h5>
          <p>
            To the maximum extent permitted by law, Nailed It Property Solutions shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use of this submission form, the rejection of a proposed bid, delays in communication, or the inability to reach a final agreement for services.
          </p>

          <h5>6. Governing Law</h5>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the State of Georgia. Any disputes arising from this preliminary submission process shall be subject to the exclusive jurisdiction of the courts located in Georgia.
          </p>

          <h5>7. Acknowledgment</h5>
          <p>
            By submitting this form, you acknowledge that you have read, understood, and agree to be bound by these Terms of Submission. You further acknowledge that no work will commence, and no final agreement is formed, until a formal, separate written contract or final quote is approved by both parties.
          </p>
        </div>
      </div>
    </section>
  );
}

export default NameYourPrice;
