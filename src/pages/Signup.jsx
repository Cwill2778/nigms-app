import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';

function Signup() {
  usePageMeta('Create Account | Nailed It Property Solutions', 'Create a new Nailed It Property Solutions account.');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen py-24 flex items-center justify-center text-white">
      <div className="max-w-md w-full px-4">
        <div className="bg-[#111111] p-8 md:p-12 rounded-lg shadow-2xl border border-white/5">
          <h1 className="text-3xl text-brand-gold font-heading font-bold uppercase tracking-widest mb-2 text-center">Create Account</h1>
          <p className="text-[#a0a0a0] text-center mb-8 font-body">Join Nailed It to manage your property services.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first-name" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">First Name</label>
                <input 
                  id="first-name" 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                  className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-gold font-body"
                />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">Last Name</label>
                <input 
                  id="last-name" 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required 
                  className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-gold font-body"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">Email</label>
              <input 
                id="signup-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-gold font-body"
              />
            </div>
            
            <div>
              <label htmlFor="signup-password" className="block text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-2 font-body">Password</label>
              <input 
                id="signup-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Create a password" 
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
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[#a0a0a0] font-body text-sm">
              Already have an account? <Link to="/login" className="text-brand-gold hover:text-white transition-colors ml-2 font-bold tracking-wider uppercase">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
