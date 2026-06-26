import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import usePageMeta from '../hooks/usePageMeta';
import './Auth.css';

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
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check Your Email</h1>
          <p className="auth-subtitle">
            We&rsquo;ve sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account, then sign in.
          </p>
          <Link to="/login" className="cta-button auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Sign up to manage your properties and track service requests.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="signup-first">First Name</label>
              <input id="signup-first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-last">Last Name</label>
              <input id="signup-last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input id="signup-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="cta-button auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
