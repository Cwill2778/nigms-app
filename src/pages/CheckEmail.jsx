import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';
import { toast } from 'sonner';

function CheckEmail() {
  usePageMeta('Verify Your Email | Nailed It Property Solutions', 'Check your inbox for your account activation link.');
  const location = useLocation();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) {
      toast.error('Email address not found. Please try signing in or registering again.');
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      toast.success('Activation link resent! Please check your inbox.');
    } catch (err) {
      console.error('Resend error:', err);
      if (err.message?.toLowerCase().includes('error sending confirmation email') || err.status === 500) {
        toast.error('Supabase email limit reached (max 3/hr) or custom SMTP failed. Disable "Confirm email" in Supabase settings or configure custom SMTP.');
      } else {
        toast.error(err.message || 'Failed to resend activation link.');
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen py-24 flex items-center justify-center text-white">
      <div className="max-w-md w-full px-4">
        <div className="bg-[#111111] p-8 md:p-12 rounded-lg shadow-2xl border border-white/5 text-center">
          
          {/* Email Icon with gold accent ring */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-gold/10 border-2 border-brand-gold flex items-center justify-center text-brand-gold shadow-[0_0_20px_rgba(191,149,63,0.25)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-3xl text-brand-gold font-heading font-bold uppercase tracking-widest mb-3">
            Check Your Email
          </h1>

          <p className="text-[#a0a0a0] leading-relaxed mb-6 font-body text-sm">
            We sent an activation link to{' '}
            {email ? (
              <span className="text-white font-semibold break-all block mt-1 text-base">{email}</span>
            ) : (
              'your inbox'
            )}
            . Click the link inside to confirm your account and get started.
          </p>

          <div className="bg-[#0A0A0A]/60 border border-white/10 rounded-lg p-4 mb-8 text-left text-xs text-[#a0a0a0] space-y-2 font-body">
            <div className="flex items-start gap-2">
              <span className="text-brand-gold font-bold">✓</span>
              <span>Activation emails typically arrive within 1 to 2 minutes.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-gold font-bold">✓</span>
              <span>Can&rsquo;t find it? Check your spam or promotions folder.</span>
            </div>
          </div>

          <div className="space-y-4">
            {email && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-transparent border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-[#0A0A0A] font-body font-bold uppercase tracking-widest px-6 py-3 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(191,149,63,0.15)]"
              >
                {resending ? 'Sending...' : 'Resend Activation Link'}
              </button>
            )}

            <Link
              to="/login"
              className="w-full gold-gradient text-[#0A0A0A] font-body font-bold uppercase tracking-widest px-8 py-3 rounded-md transition-transform hover:scale-[1.02] block text-sm shadow-lg"
            >
              Back to Sign In
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-[#a0a0a0]">
            Need help?{' '}
            <Link to="/contact" className="text-brand-gold hover:text-white uppercase tracking-wider font-bold ml-1">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckEmail;