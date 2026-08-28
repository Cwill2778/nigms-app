import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import usePageMeta from '../hooks/usePageMeta';

// Replace with your actual Stripe Publishable Key
const stripePromise = loadStripe('pk_test_placeholder_key_replace_me');

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Address is required'),
});

const planDetails = {
  core: { name: 'Core', price: '$49/mo' },
  advanced: { name: 'Advanced', price: '$129/mo' },
  premier: { name: 'Premier', price: '$199/mo' },
};

function CheckoutForm({ selectedTier }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data) => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    
    // In a real app, you would call your Supabase Edge Function here to create a PaymentIntent
    // or Subscription and then call stripe.confirmCardPayment with the clientSecret
    
    // Simulating network request for now
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Subscription activated! Welcome to Nailed It.', {
        description: `You are now subscribed to the ${planDetails[selectedTier].name} plan.`
      });
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Full Name</label>
        <input type="text" {...register('name')} placeholder="John Doe" className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors" />
        {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Email Address</label>
        <input type="email" {...register('email')} placeholder="john@example.com" className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors" />
        {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Phone Number</label>
        <input type="tel" {...register('phone')} placeholder="(555) 555-5555" className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors" />
        {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Property Address</label>
        <input type="text" {...register('address')} placeholder="123 Main St, Rome, GA" className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors" />
        {errors.address && <span className="text-red-500 text-xs mt-1 block">{errors.address.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Credit Card Details</label>
        <div className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-4 text-text-main focus-within:border-brand-orange transition-colors">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#E0E0E0',
                '::placeholder': { color: '#888' },
                fontFamily: 'system-ui, sans-serif'
              },
              invalid: { color: '#ef4444' },
            },
          }}/>
        </div>
      </div>

      <button type="submit" disabled={!stripe || isProcessing} className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)] disabled:opacity-70 disabled:cursor-not-allowed mt-8">
        {isProcessing ? 'Processing...' : `Subscribe for ${planDetails[selectedTier].price}`}
      </button>
    </form>
  );
}

function Checkout() {
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier') || 'core';
  
  usePageMeta('Checkout | Nailed It Property Solutions', 'Securely checkout and subscribe to your property maintenance plan.');

  if (!planDetails[tier]) {
    return (
      <div className="w-full bg-wood-900 min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Invalid Plan</h2>
          <p className="text-text-sub">Please return to the subscriptions page and select a valid plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-wood-900 min-h-screen py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Complete Your Subscription</h2>
            <div className="h-1 w-16 bg-brand-orange mx-auto mb-6"></div>
            
            <div className="bg-wood-800 border-2 border-brand-orange p-6 rounded-lg inline-block text-center shadow-lg mb-4">
              <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">{planDetails[tier].name} Plan</h3>
              <p className="text-brand-orange text-xl font-bold mt-1">{planDetails[tier].price}</p>
            </div>
            
            <p className="text-sm text-text-sub flex items-center justify-center mt-4">
              <span className="mr-2">🔒</span> Secure checkout powered by Stripe
            </p>
          </div>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm selectedTier={tier} />
          </Elements>

        </div>
      </div>
    </div>
  );
}

export default Checkout;
