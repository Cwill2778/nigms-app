import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import './Careers.css';

const STEPS = ['Contact', 'Skills', 'Logistics', 'Review'];

function Careers() {
  useScrollReveal();
  usePageMeta(
    'Careers | Join the Nailed It Property Solutions Team | Rome, GA',
    'Looking for a hands-on career in property maintenance? Join Nailed It Property Solutions in Rome, GA. Apply today for handyman, painter, and technician positions.'
  );

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    phone: '',
    contactMethod: '',
    city: '',
    zip: '',
    workAuth: '',
    over18: '',
    hasLicense: '',
    employmentType: '',
    position: '',
    experience: '',
    skills: [],
    hasTools: '',
    certifications: '',
    startDate: '',
    availability: [],
    lastJob: '',
    references: '',
    acknowledge: false,
    signature: '',
    signDate: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'skills') {
      setFormData((prev) => ({
        ...prev,
        skills: checked
          ? [...prev.skills, value]
          : prev.skills.filter((s) => s !== value),
      }));
    } else if (type === 'checkbox' && name === 'availability') {
      setFormData((prev) => ({
        ...prev,
        availability: checked
          ? [...prev.availability, value]
          : prev.availability.filter((a) => a !== value),
      }));
    } else if (type === 'checkbox' && name === 'acknowledge') {
      setFormData((prev) => ({ ...prev, acknowledge: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    const submission = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      submission.append(key, Array.isArray(val) ? val.join(', ') : val);
    });

    // Save to Supabase for admin dashboard
    supabase.from('career_applications').insert({
      data: formData,
      status: 'new',
    }).then();

    // Also send via Formspree for email notification
    fetch('https://formspree.io/f/xrewzpvl', {
      method: 'POST',
      body: submission,
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.ok) {
          alert('Application submitted! We will be in touch if there is a fit.');
          setStep(0);
          setFormData({
            firstName: '', lastName: '', dob: '', email: '', phone: '',
            contactMethod: '', city: '', zip: '', workAuth: '', over18: '',
            hasLicense: '', employmentType: '', position: '', experience: '',
            skills: [], hasTools: '', certifications: '', startDate: '',
            availability: [], lastJob: '', references: '', acknowledge: false,
            signature: '', signDate: '',
          });
        } else {
          alert('Something went wrong. Please try again.');
        }
      })
      .catch(() => alert('Something went wrong. Please try again.'));
  };

  return (
    <div className="careers">
      <section className="careers-intro reveal">
        <h1>Join Our Team</h1>
        <p>
          Nailed It Property Solutions is growing — and we&rsquo;re looking for
          skilled, reliable people who take pride in honest work. If you believe
          in doing things right the first time and want to be part of a team
          that&rsquo;s raising the standard for property care in Rome, GA, we want
          to hear from you.
        </p>
        <p>
          We offer competitive pay, a respectful work environment, and the
          opportunity to build something meaningful in your community.
        </p>
      </section>

      <section className="careers-values reveal">
        <h2>What We Look For</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="values-grid">
          <div className="value-item">
            <h3>Integrity</h3>
            <p>You do the right thing even when no one is watching. You treat clients&rsquo; homes like your own.</p>
          </div>
          <div className="value-item">
            <h3>Reliability</h3>
            <p>You show up on time, communicate clearly, and follow through on commitments.</p>
          </div>
          <div className="value-item">
            <h3>Skill &amp; Willingness to Learn</h3>
            <p>Whether you&rsquo;re experienced or eager to grow, we value people who take the craft seriously.</p>
          </div>
          <div className="value-item">
            <h3>Local Pride</h3>
            <p>You care about the Rome community and want to see properties — and people — thrive.</p>
          </div>
        </div>
      </section>

      <section className="careers-apply reveal">
        <h2>Apply Now</h2>
        <div className="accent-bar" aria-hidden="true"></div>

        <div className="form-progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`progress-step${i === step ? ' active' : ''}${i < step ? ' completed' : ''}`}>
              <span className="progress-dot"></span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <form className="career-form" onSubmit={handleSubmit}>
          {/* Step 1: Contact */}
          {step === 0 && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Preferred Contact Method</label>
                <div className="radio-group">
                  <label><input type="radio" name="contactMethod" value="Email" checked={formData.contactMethod === 'Email'} onChange={handleChange} /> Email</label>
                  <label><input type="radio" name="contactMethod" value="Text" checked={formData.contactMethod === 'Text'} onChange={handleChange} /> Text</label>
                  <label><input type="radio" name="contactMethod" value="Phone" checked={formData.contactMethod === 'Phone'} onChange={handleChange} /> Phone</label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="zip">Zip Code</label>
                  <input type="text" id="zip" name="zip" value={formData.zip} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-nav">
                <button type="button" className="cta-button" onClick={nextStep}>Next: Skills &rarr;</button>
              </div>
            </>
          )}

          {/* Step 2: Skills */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="position">Position Applied For</label>
                <select id="position" name="position" value={formData.position} onChange={handleChange} required>
                  <option value="">Select a position</option>
                  <option value="General Maintenance">General Maintenance</option>
                  <option value="Painter">Painter</option>
                  <option value="Drywall Specialist">Drywall Specialist</option>
                  <option value="Unit Turnover Tech">Unit Turnover Tech</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="experience">Years of Experience</label>
                <select id="experience" name="experience" value={formData.experience} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="0-1">0 – 1 years</option>
                  <option value="2-4">2 – 4 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trade Skills (check all that apply)</label>
                <div className="checkbox-group">
                  {['Plumbing basics', 'Electrical basics', 'HVAC', 'Drywall repair', 'Painting', 'Carpentry', 'Roofing'].map((skill) => (
                    <label key={skill}>
                      <input type="checkbox" name="skills" value={skill} checked={formData.skills.includes(skill)} onChange={handleChange} />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Do you have your own tools?</label>
                <div className="radio-group">
                  <label><input type="radio" name="hasTools" value="Yes" checked={formData.hasTools === 'Yes'} onChange={handleChange} /> Yes</label>
                  <label><input type="radio" name="hasTools" value="No" checked={formData.hasTools === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="hasTools" value="Some" checked={formData.hasTools === 'Some'} onChange={handleChange} /> Some</label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="certifications">Certifications or Licenses</label>
                <textarea id="certifications" name="certifications" value={formData.certifications} onChange={handleChange} placeholder="EPA certification, trade licenses, etc."></textarea>
              </div>
              <div className="form-nav">
                <button type="button" className="cta-button btn-back" onClick={prevStep}>&larr; Back</button>
                <button type="button" className="cta-button" onClick={nextStep}>Next: Logistics &rarr;</button>
              </div>
            </>
          )}

          {/* Step 3: Logistics */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label>Authorized to work in the US?</label>
                <div className="radio-group">
                  <label><input type="radio" name="workAuth" value="Yes" checked={formData.workAuth === 'Yes'} onChange={handleChange} required /> Yes</label>
                  <label><input type="radio" name="workAuth" value="No" checked={formData.workAuth === 'No'} onChange={handleChange} /> No</label>
                </div>
              </div>
              <div className="form-group">
                <label>Are you 18 years of age or older?</label>
                <div className="radio-group">
                  <label><input type="radio" name="over18" value="Yes" checked={formData.over18 === 'Yes'} onChange={handleChange} required /> Yes</label>
                  <label><input type="radio" name="over18" value="No" checked={formData.over18 === 'No'} onChange={handleChange} /> No</label>
                </div>
              </div>
              <div className="form-group">
                <label>Valid driver&rsquo;s license &amp; reliable transportation?</label>
                <div className="radio-group">
                  <label><input type="radio" name="hasLicense" value="Yes" checked={formData.hasLicense === 'Yes'} onChange={handleChange} required /> Yes</label>
                  <label><input type="radio" name="hasLicense" value="No" checked={formData.hasLicense === 'No'} onChange={handleChange} /> No</label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="employmentType">Employment Type</label>
                <select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="W-2 Employee">W-2 Employee</option>
                  <option value="1099 Independent Contractor">1099 Independent Contractor</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Available to Start</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Schedule Availability</label>
                <div className="checkbox-group">
                  {['Full-time', 'Part-time', 'Weekends', 'Emergency On-Call'].map((avail) => (
                    <label key={avail}>
                      <input type="checkbox" name="availability" value={avail} checked={formData.availability.includes(avail)} onChange={handleChange} />
                      {avail}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="lastJob">Most Recent Job &amp; Reason for Leaving</label>
                <textarea id="lastJob" name="lastJob" value={formData.lastJob} onChange={handleChange} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="references">References (name &amp; phone for two professional references)</label>
                <textarea id="references" name="references" value={formData.references} onChange={handleChange} rows="3"></textarea>
              </div>
              <div className="form-nav">
                <button type="button" className="cta-button btn-back" onClick={prevStep}>&larr; Back</button>
                <button type="button" className="cta-button" onClick={nextStep}>Next: Review &rarr;</button>
              </div>
            </>
          )}

          {/* Step 4: Review & Submit */}
          {step === 3 && (
            <>
              <div className="acknowledgment">
                <label>
                  <input type="checkbox" name="acknowledge" checked={formData.acknowledge} onChange={handleChange} required />
                  I certify that the information provided is true and complete to the best of my knowledge. I understand that any false statements may disqualify me from employment or result in termination.
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signature">Digital Signature (type full name)</label>
                  <input type="text" id="signature" name="signature" value={formData.signature} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="signDate">Date</label>
                  <input type="date" id="signDate" name="signDate" value={formData.signDate} onChange={handleChange} required />
                </div>
              </div>
              <p className="secure-note">
                SSN, government ID, and resume will be collected securely after initial review.
              </p>
              <div className="form-nav">
                <button type="button" className="cta-button btn-back" onClick={prevStep}>&larr; Back</button>
                <button type="submit" className="cta-button" disabled={!formData.acknowledge}>Submit Application</button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  );
}

export default Careers;
