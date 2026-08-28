import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import './NameYourPrice.css';

const MIN_PRICE = 55;
const MAX_PRICE = 2499;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const nypSchema = z.object({
  description: z.string().min(5, 'Please describe what you need done.'),
  name: z.string().min(2, 'Please enter your name.'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  price: z.number().min(MIN_PRICE).max(MAX_PRICE),
}).refine(data => data.phone || data.email, {
  message: 'Please provide either a phone number or an email address.',
  path: ['phone'],
});

function NameYourPrice() {
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(nypSchema),
    defaultValues: {
      description: '',
      name: '',
      phone: '',
      email: '',
      price: 250,
    }
  });

  const watchPrice = watch('price');

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    if (valid.length !== selected.length) {
      toast.warning('Some files were too large and were ignored (Max 25MB).');
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const attachmentPaths = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('nyp-attachments').upload(path, file);
        if (!uploadError) attachmentPaths.push(path);
      }

      const { error: insertError } = await supabase.from('name_your_price').insert({
        customer_name: data.name.trim(),
        customer_phone: data.phone?.trim() || null,
        customer_email: data.email?.trim() || null,
        description: data.description.trim(),
        offered_price: data.price * 100, // store in cents
        attachments: attachmentPaths.length > 0 ? attachmentPaths : [],
        terms_accepted: true,
      });

      if (insertError) throw insertError;
      if (window.rkp) window.rkp('event', 'CONTACT');
      
      toast.success('Request Submitted Successfully!');
      setSubmitted(true);
    } catch (err) {
      toast.error('Something went wrong.', { description: err?.message || 'Please try again or call us.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="nyp-section" id="name-your-price">
        <div className="nyp-success">
          <span className="nyp-success-icon">✓</span>
          <h2>We Got It!</h2>
          <p>We&rsquo;ll review your request and reach out shortly. If your price works, we&rsquo;ll get you scheduled.</p>
          <button className="cta-button" onClick={() => { setSubmitted(false); reset(); setFiles([]); }}>
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

        <form className="nyp-form" onSubmit={handleSubmit(onSubmit)}>
          <textarea
            {...register('description')}
            placeholder="What do you need done?"
            rows={3}
            className={errors.description ? 'input-error' : ''}
          />
          {errors.description && <span className="error-text" style={{color: '#e63946', fontSize: '0.8rem', display: 'block', marginTop: '-12px', marginBottom: '16px'}}>{errors.description.message}</span>}

          <div className="nyp-price-section">
            <label>Your budget</label>
            <div className="nyp-price-row">
              <span className="nyp-dollar">$</span>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    className="nyp-price-input"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || MIN_PRICE)}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || MIN_PRICE;
                      field.onChange(Math.min(Math.max(val, MIN_PRICE), MAX_PRICE));
                    }}
                  />
                )}
              />
            </div>
            <input 
              type="range" 
              className="nyp-slider" 
              min={MIN_PRICE} 
              max={MAX_PRICE} 
              step={5} 
              value={watchPrice} 
              onChange={(e) => setValue('price', parseInt(e.target.value))} 
            />
            <div className="nyp-price-range"><span>${MIN_PRICE}</span><span>${MAX_PRICE}</span></div>
          </div>

          <div className="nyp-contact-row">
            <div>
              <input type="text" {...register('name')} placeholder="Your name *" className={errors.name ? 'input-error' : ''} />
              {errors.name && <span className="error-text" style={{color: '#e63946', fontSize: '0.8rem'}}>{errors.name.message}</span>}
            </div>
            <div>
              <input type="tel" {...register('phone')} placeholder="Phone" className={errors.phone ? 'input-error' : ''} />
              {errors.phone && <span className="error-text" style={{color: '#e63946', fontSize: '0.8rem'}}>{errors.phone.message}</span>}
            </div>
            <div>
              <input type="email" {...register('email')} placeholder="Email" className={errors.email ? 'input-error' : ''} />
              {errors.email && <span className="error-text" style={{color: '#e63946', fontSize: '0.8rem'}}>{errors.email.message}</span>}
            </div>
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

          <button type="submit" className="cta-button nyp-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Submit Request'}
          </button>

          <p className="nyp-terms-notice">By submitting, you agree to our <Link to="/terms#name-your-price-terms">Terms of Use</Link>.</p>
        </form>
      </div>
    </section>
  );
}

export default NameYourPrice;
