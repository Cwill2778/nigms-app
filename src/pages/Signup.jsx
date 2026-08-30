import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';

function Signup() {
  usePageMeta('Create Account | Nailed It Property Solutions', 'Create a free account to manage your properties, track service requests, and access member pricing.');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Roku Pixel: Complete Registration event
      if (window.rkp) window.rkp('event', 'COMPLETE_REGISTRATION');
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="w-full bg-wood-900 min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl text-center">
            <div className="text-5xl mb-6">✉️</div>
            <h1 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Check Your Email</h1>
            <p className="text-text-sub leading-relaxed mb-8">
              We&rsquo;ve sent a confirmation link to <strong className="text-brand-orange">{email}</strong>. Click the link to activate your account, then sign in.
            </p>
            <Link to="/login" className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg inline-block shadow-[0_0_15px_rgba(255,95,31,0.3)]">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-wood-900 min-h-screen py-24 flex items-center justify-center">
      <div className="max-w-lg w-full px-4">
        <div className="bg-wood-800 p-8 md:p-12 rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] border border-wood-700/50">
          <h1 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-2 text-center">Create Account</h1>
          <div className="h-1 w-16 bg-brand-orange mx-auto mb-6"></div>
          <p className="text-text-sub text-center mb-8">Sign up to manage your properties and track service requests.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="signup-first" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">First Name</label>
                <input 
                  id="signup-first" 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="First name" 
                  required 
                  className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
                />
              </div>
              <div>
                <label htmlFor="signup-last" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Last Name</label>
                <input 
                  id="signup-last" 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Last name" 
                  required 
                  className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Email</label>
              <input 
                id="signup-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
              />
            </div>
            
            <div>
              <label htmlFor="signup-password" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Password</label>
              <input 
                id="signup-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="At least 6 characters" 
                required 
                className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
              />
            </div>
            
            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Confirm Password</label>
              <input 
                id="signup-confirm" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm password" 
                required 
                className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-bold bg-red-900/20 p-3 rounded border border-red-900/50">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-text-sub">
              Already have an account? <Link to="/login" className="text-brand-orange hover:text-brand-hover font-bold tracking-wider uppercase transition-colors ml-2">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
