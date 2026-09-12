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
    <div className="w-full bg-[#0A0A0A] min-h-screen py-24 flex items-center justify-center text-white">
      <div className="max-w-md w-full px-4">
        <div className="bg-[#111111] p-8 md:p-12 rounded-lg shadow-2xl border border-white/5">
          <h1 className="text-3xl text-brand-gold font-heading font-bold uppercase tracking-widest mb-2 text-center">Sign In</h1>
          <p className="text-[#a0a0a0] text-center mb-8 font-body">Welcome back. Sign in to manage your account.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">Email</label>
              <input 
                id="login-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-gold font-body"
              />
            </div>
            
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">Password</label>
              <input 
                id="login-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Your password" 
                required 
                className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-gold font-body"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-bold bg-red-900/20 p-3 rounded border border-red-900/50">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full gold-gradient text-[#0A0A0A] font-body font-bold uppercase tracking-widest px-8 py-4 rounded-md transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[#a0a0a0] font-body text-sm">
              Don&rsquo;t have an account? <Link to="/signup" className="text-brand-gold hover:text-white transition-colors ml-2 font-bold tracking-wider uppercase">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
