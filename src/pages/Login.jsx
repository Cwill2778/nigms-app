import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';

function Login() {
  usePageMeta('Sign In | Nailed It Property Solutions', 'Sign in to your Nailed It Property Solutions account to manage properties and service requests.');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="w-full bg-wood-900 min-h-screen py-24 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-wood-800 p-8 md:p-12 rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] border border-wood-700/50">
          <h1 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-2 text-center">Sign In</h1>
          <div className="h-1 w-16 bg-brand-orange mx-auto mb-6"></div>
          <p className="text-text-sub text-center mb-8">Welcome back. Sign in to manage your account.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Email</label>
              <input 
                id="login-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                className="w-full bg-wood-900 border-none rounded-md px-4 py-3 text-text-main shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-1 focus:ring-brand-orange transition-shadow"
              />
            </div>
            
            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Password</label>
              <input 
                id="login-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Your password" 
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-text-sub">
              Don&rsquo;t have an account? <Link to="/signup" className="text-brand-orange hover:text-brand-hover font-bold tracking-wider uppercase transition-colors ml-2">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
