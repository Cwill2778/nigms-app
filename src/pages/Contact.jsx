import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import portrait from '../assets/charlesImg.jpg';

const contactSchema = z.object({
  name: z.string().min(2, 'Please provide your full name'),
  address: z.string().min(5, 'We need the address to know where to go'),
  email: z.string().email('Please provide a valid email'),
  phone: z.string().min(10, 'We need a valid phone number to reach you'),
  interest: z.string().min(1, 'Please select how we can help'),
  message: z.string().min(10, 'Please provide a few more details so we know what to bring'),
});

function Contact() {
  useScrollToTop();
  usePageMeta(
    'Contact Nailed It Property Solutions | Book a Service',
    'Reach out to Nailed It Property Solutions for estimates, emergency repairs, or maintenance subscriptions in Rome, GA.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await supabase.from('contact_submissions').insert(data);
      if (window.rkp) window.rkp('event', 'CONTACT');
      
      const res = await fetch('https://formspree.io/f/xqeooyyl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Request Received!', { description: "We've got your info and will be in touch shortly." });
        reset();
      } else {
        throw new Error('Formspree returned an error');
      }
    } catch (error) {
      toast.error('Something went wrong.', { description: 'Please try again or call us directly.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          Let's Get To Work.
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-8"></div>
        <p className="text-xl text-text-sub leading-relaxed max-w-2xl mx-auto">
          Stop dealing with property stress. Drop us a line below, and we'll get back to you with real solutions and honest pricing.
        </p>
      </section>

      {/* Main Bio Grid from About Us */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-brand-orange rounded-xl translate-x-4 translate-y-4 opacity-50"></div>
            {/* Removed grayscale class so it is colored */}
            <img 
              src={portrait} 
              alt="Charles Willis, Owner" 
              className="relative z-10 w-full h-auto rounded-xl shadow-2xl border border-border-subtle"
            />
            <div className="absolute -bottom-6 -right-6 z-20 bg-wood-card border-2 border-brand-orange p-4 rounded-lg shadow-xl">
              <p className="text-text-main font-heading font-bold uppercase tracking-wider">Charles Willis</p>
              <p className="text-brand-orange text-sm font-bold uppercase tracking-widest">Founder & Operator</p>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
              Built on Trust. <span className="block text-brand-orange mt-2">Driven by Craftsmanship.</span>
            </h2>
            <div className="h-1 w-16 bg-brand-orange mb-8"></div>
            <p className="text-lg text-text-sub leading-relaxed mb-6">
              Charles Willis is a skilled tradesman and Rome, GA native who built Nailed It Property Solutions to fix an industry plagued by unreliability.
            </p>
            <p className="text-md text-text-sub leading-relaxed mb-6 border-l-4 border-brand-orange pl-6 italic">
              "I started this company because I saw too many homeowners getting ghosted by contractors, overcharged for simple fixes, or left with sub-par work. I wanted to bring professionalism and transparency back to the trades."
            </p>
            <p className="text-md text-text-sub leading-relaxed">
              With a diverse background in heavy equipment operation, fine carpentry, and comprehensive property management, Charles possesses the unique ability to diagnose complex structural issues while maintaining an eye for finish details.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Contact Info Sidebar */}
          <div className="w-full md:w-1/3 bg-wood-800/80 border border-border-subtle p-8 rounded-xl shadow-lg h-fit">
            <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 border-b border-border-subtle pb-4">Reach Out Directly</h2>
            
            <div className="mb-6">
              <h3 className="text-text-sub text-sm uppercase tracking-wider mb-1">Service Area</h3>
              <p className="text-text-main font-bold">Proudly serving Rome, GA, and surrounding areas.</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-text-sub text-sm uppercase tracking-wider mb-1">Call or Text</h3>
              <a href="tel:7062378184" className="text-brand-orange text-xl font-heading font-bold hover:text-brand-hover transition-colors">706.237.8184</a>
            </div>
            
            <div className="mb-6">
              <h3 className="text-text-sub text-sm uppercase tracking-wider mb-1">Email Us</h3>
              <a href="mailto:info@naileditpropertysolutions.com" className="text-brand-orange hover:text-brand-hover transition-colors break-all">info@naileditpropertysolutions.com</a>
            </div>
            
            <div className="mb-6">
              <h3 className="text-text-sub text-sm uppercase tracking-wider mb-1">Availability</h3>
              <p className="text-text-main font-bold flex items-center"><span className="mr-2 text-brand-orange">🟢</span> 24/7 Emergency Response</p>
              <p className="text-xs text-text-sub mt-1 italic">Because emergencies don't stick to business hours.</p>
              <p className="text-text-main font-bold flex items-center">Business Hours: Monday - Saturday 7:00 a.m. to 7:00 p.m. & </p>
              <p className="text-text-main flex items-center">Sunday 12:30 p.m. to 5:30 p.m.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full md:w-2/3 bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
            <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-8">Tell Us What You Need</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    {...register('name')} 
                    className={`w-full bg-wood-900 border ${errors.name ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors`} 
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Best Contact Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    {...register('phone')} 
                    className={`w-full bg-wood-900 border ${errors.phone ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors`} 
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  {...register('email')} 
                  className={`w-full bg-wood-900 border ${errors.email ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors`} 
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Service Address</label>
                <input 
                  type="text" 
                  id="address" 
                  {...register('address')} 
                  className={`w-full bg-wood-900 border ${errors.address ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors`} 
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <label htmlFor="interest" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">How Can We Help?</label>
                <select 
                  id="interest" 
                  {...register('interest')} 
                  className={`w-full bg-wood-900 border ${errors.interest ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors appearance-none`}
                >
                  <option value="">Select an option...</option>
                  <option value="I need something fixed right now (Emergency)">I need something fixed right now (Emergency)</option>
                  <option value="I need a quote for a repair or project">I need a quote for a repair or project</option>
                  <option value="I want to sign up for a Maintenance Subscription">I want to sign up for a Maintenance Subscription</option>
                  <option value="I'm a landlord looking for Portfolio Management">I'm a landlord looking for Portfolio Management</option>
                  <option value="I just have a general question">I just have a general question</option>
                </select>
                {errors.interest && <p className="text-red-500 text-xs mt-1">{errors.interest.message}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Give Us The Details:</label>
                <textarea 
                  id="message" 
                  rows="5" 
                  placeholder="Tell us a little bit about what's going on..."
                  {...register('message')} 
                  className={`w-full bg-wood-900 border ${errors.message ? 'border-red-500' : 'border-border-subtle'} rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors`}
                ></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Submit Your Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
