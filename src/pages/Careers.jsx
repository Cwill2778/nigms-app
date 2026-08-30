import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';

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

  const inputClasses = "w-full bg-wood-900 border-none rounded-md p-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow mb-4";
  const labelClasses = "block text-sm font-bold text-text-sub uppercase tracking-wider mb-2 mt-4";
  const btnClasses = "bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-2 rounded transition-colors shadow-[0_0_15px_rgba(255,95,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed";
  const btnBackClasses = "bg-transparent border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-wood-900 font-heading font-bold uppercase tracking-wider px-6 py-2 rounded transition-colors";

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 page-fade-in">
      <section className="text-center mb-16 reveal">
        <h1 className="text-4xl md:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Join Our Team</h1>
        <div className="max-w-3xl mx-auto text-lg text-text-sub space-y-4">
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
        </div>
      </section>

      <section className="mb-20 reveal">
        <h2 className="text-3xl font-heading font-bold text-center uppercase tracking-widest text-text-main mb-8">What We Look For</h2>
        <div className="w-24 h-1 bg-brand-orange mx-auto mb-12 shadow-[0_0_10px_rgba(255,95,31,0.5)]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Integrity', desc: 'You do the right thing even when no one is watching. You treat clients\' homes like your own.' },
            { title: 'Reliability', desc: 'You show up on time, communicate clearly, and follow through on commitments.' },
            { title: 'Skill & Willingness', desc: 'Whether you\'re experienced or eager to grow, we value people who take the craft seriously.' },
            { title: 'Local Pride', desc: 'You care about the Rome community and want to see properties — and people — thrive.' },
          ].map((val, i) => (
            <div key={i} className="bg-wood-800 p-8 rounded-xl text-center border border-wood-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)]">
              <h3 className="text-xl font-heading font-bold uppercase text-brand-orange mb-4">{val.title}</h3>
              <p className="text-text-sub">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="reveal max-w-3xl mx-auto">
        <h2 className="text-3xl font-heading font-bold text-center uppercase tracking-widest text-text-main mb-8">Apply Now</h2>
        <div className="w-24 h-1 bg-brand-orange mx-auto mb-12 shadow-[0_0_10px_rgba(255,95,31,0.5)]"></div>

        <div className="flex justify-between items-center mb-12 px-4">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex flex-col items-center flex-1 ${i === step ? 'text-brand-orange' : i < step ? 'text-text-main' : 'text-wood-700'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold ${i === step ? 'bg-brand-orange text-wood-900 shadow-[0_0_10px_rgba(255,95,31,0.5)]' : i < step ? 'bg-wood-700 text-text-main' : 'bg-wood-800 text-wood-700 border border-wood-700'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-heading uppercase tracking-wider hidden sm:block">{label}</span>
            </div>
          ))}
        </div>

        <form className="bg-wood-800 p-8 md:p-12 rounded-xl border border-wood-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)]" onSubmit={handleSubmit}>
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} htmlFor="firstName">First Name</label>
                  <input className={inputClasses} type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="lastName">Last Name</label>
                  <input className={inputClasses} type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label className={labelClasses} htmlFor="dob">Date of Birth</label>
                <input className={inputClasses} type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelClasses} htmlFor="email">Email Address</label>
                <input className={inputClasses} type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelClasses} htmlFor="phone">Phone Number</label>
                <input className={inputClasses} type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelClasses}>Preferred Contact Method</label>
                <div className="flex gap-6 mb-4">
                  {['Email', 'Text', 'Phone'].map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer text-text-main">
                      <input type="radio" name="contactMethod" value={method} checked={formData.contactMethod === method} onChange={handleChange} className="accent-brand-orange w-4 h-4" /> {method}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} htmlFor="city">City</label>
                  <input className={inputClasses} type="text" id="city" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="zip">Zip Code</label>
                  <input className={inputClasses} type="text" id="zip" name="zip" value={formData.zip} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <button type="button" className={btnClasses} onClick={nextStep}>Next: Skills &rarr;</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={labelClasses} htmlFor="position">Position Applied For</label>
                <select className={inputClasses} id="position" name="position" value={formData.position} onChange={handleChange} required>
                  <option value="">Select a position</option>
                  <option value="General Maintenance">General Maintenance</option>
                  <option value="Painter">Painter</option>
                  <option value="Drywall Specialist">Drywall Specialist</option>
                  <option value="Unit Turnover Tech">Unit Turnover Tech</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="experience">Years of Experience</label>
                <select className={inputClasses} id="experience" name="experience" value={formData.experience} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="0-1">0 – 1 years</option>
                  <option value="2-4">2 – 4 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Trade Skills (check all that apply)</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['Plumbing basics', 'Electrical basics', 'HVAC', 'Drywall repair', 'Painting', 'Carpentry', 'Roofing'].map((skill) => (
                    <label key={skill} className="flex items-center gap-2 cursor-pointer text-text-sub hover:text-text-main transition-colors">
                      <input type="checkbox" name="skills" value={skill} checked={formData.skills.includes(skill)} onChange={handleChange} className="accent-brand-orange w-4 h-4 rounded" />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses}>Do you have your own tools?</label>
                <div className="flex gap-6 mb-4">
                  {['Yes', 'No', 'Some'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-text-main">
                      <input type="radio" name="hasTools" value={opt} checked={formData.hasTools === opt} onChange={handleChange} className="accent-brand-orange w-4 h-4" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses} htmlFor="certifications">Certifications or Licenses</label>
                <textarea className={`${inputClasses} min-h-[80px]`} id="certifications" name="certifications" value={formData.certifications} onChange={handleChange} placeholder="EPA certification, trade licenses, etc."></textarea>
              </div>
              <div className="flex justify-between mt-8">
                <button type="button" className={btnBackClasses} onClick={prevStep}>&larr; Back</button>
                <button type="button" className={btnClasses} onClick={nextStep}>Next: Logistics &rarr;</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClasses}>Authorized to work in the US?</label>
                <div className="flex gap-6 mb-4">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-text-main">
                      <input type="radio" name="workAuth" value={opt} checked={formData.workAuth === opt} onChange={handleChange} required className="accent-brand-orange w-4 h-4" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses}>Are you 18 years of age or older?</label>
                <div className="flex gap-6 mb-4">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-text-main">
                      <input type="radio" name="over18" value={opt} checked={formData.over18 === opt} onChange={handleChange} required className="accent-brand-orange w-4 h-4" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses}>Valid driver&rsquo;s license &amp; reliable transportation?</label>
                <div className="flex gap-6 mb-4">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-text-main">
                      <input type="radio" name="hasLicense" value={opt} checked={formData.hasLicense === opt} onChange={handleChange} required className="accent-brand-orange w-4 h-4" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses} htmlFor="employmentType">Employment Type</label>
                <select className={inputClasses} id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="W-2 Employee">W-2 Employee</option>
                  <option value="1099 Independent Contractor">1099 Independent Contractor</option>
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="startDate">Available to Start</label>
                <input className={inputClasses} type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClasses}>Schedule Availability</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['Full-time', 'Part-time', 'Weekends', 'Emergency On-Call'].map((avail) => (
                    <label key={avail} className="flex items-center gap-2 cursor-pointer text-text-sub hover:text-text-main transition-colors">
                      <input type="checkbox" name="availability" value={avail} checked={formData.availability.includes(avail)} onChange={handleChange} className="accent-brand-orange w-4 h-4 rounded" />
                      {avail}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClasses} htmlFor="lastJob">Most Recent Job &amp; Reason for Leaving</label>
                <textarea className={`${inputClasses} min-h-[80px]`} id="lastJob" name="lastJob" value={formData.lastJob} onChange={handleChange}></textarea>
              </div>
              <div>
                <label className={labelClasses} htmlFor="references">References (name &amp; phone for two professional references)</label>
                <textarea className={`${inputClasses} min-h-[80px]`} id="references" name="references" value={formData.references} onChange={handleChange}></textarea>
              </div>
              <div className="flex justify-between mt-8">
                <button type="button" className={btnBackClasses} onClick={prevStep}>&larr; Back</button>
                <button type="button" className={btnClasses} onClick={nextStep}>Next: Review &rarr;</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="bg-wood-900/50 p-6 rounded-lg mb-8 border border-wood-700/50">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input type="checkbox" name="acknowledge" checked={formData.acknowledge} onChange={handleChange} required className="accent-brand-orange w-5 h-5 mt-1" />
                  <span className="text-sm text-text-sub leading-relaxed">I certify that the information provided is true and complete to the best of my knowledge. I understand that any false statements may disqualify me from employment or result in termination.</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} htmlFor="signature">Digital Signature (type full name)</label>
                  <input className={inputClasses} type="text" id="signature" name="signature" value={formData.signature} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="signDate">Date</label>
                  <input className={inputClasses} type="date" id="signDate" name="signDate" value={formData.signDate} onChange={handleChange} required />
                </div>
              </div>
              <p className="text-xs text-text-sub italic text-center mt-4">
                SSN, government ID, and resume will be collected securely after initial review.
              </p>
              <div className="flex justify-between mt-8">
                <button type="button" className={btnBackClasses} onClick={prevStep}>&larr; Back</button>
                <button type="submit" className={btnClasses} disabled={!formData.acknowledge}>Submit Application</button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  );
}

export default Careers;
