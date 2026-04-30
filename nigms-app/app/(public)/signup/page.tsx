'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NLoader from '@/components/NLoader';
import Logo from '@/components/Logo';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    // Client-side validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setGeneralError('Full name, email, and password are required.');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          company_name: companyName.trim() || undefined,
          email: email.trim(),
          password,
        }),
      });

      if (res.status === 409) {
        setEmailError('An account with this email already exists.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGeneralError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Auto-login with the credentials they just registered with
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        // Login failed but account was created — send them to login page
        router.push('/login?signup=success');
        return;
      }

      // Fully authenticated — start onboarding (Step 1: property setup)
      router.push('/property');
    } catch {
      setGeneralError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero Panel with Charles photo + Trust Navy overlay */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-end"
        style={{
          backgroundImage: "url('/charles-photo.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundColor: '#1B263B',
        }}
      >
        {/* Trust Navy tint overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(27, 38, 59, 0.65)' }}
        />
        <div className="relative z-10 p-10 text-white">
          <p className="text-2xl font-bold leading-snug mb-2 font-heading">
            Professional maintenance,<br />on your schedule.
          </p>
          <p className="text-sm opacity-75">
            Trusted by property managers across the region.
          </p>
        </div>
      </div>

      {/* Right: Registration Card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-architectural-gray">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold mb-1 text-center text-trust-navy font-heading">
            Create Your Account
          </h1>
          <p className="text-sm text-steel-gray text-center mb-6">
            Start managing your properties with confidence
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-trust-navy">
                Full Name <span className="text-precision-coral">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-precision-coral"
                placeholder="Your full name"
              />
            </div>

            {/* Company Name (optional) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="companyName" className="text-sm font-medium text-trust-navy">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-precision-coral"
                placeholder="Optional"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-trust-navy">
                Email <span className="text-precision-coral">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-precision-coral"
                placeholder="your@email.com"
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-0.5" role="alert">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-trust-navy">
                Password <span className="text-precision-coral">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-precision-coral"
                placeholder="At least 8 characters"
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-trust-navy">
                Confirm Password <span className="text-precision-coral">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-precision-coral"
                placeholder="Re-enter your password"
              />
              {passwordError && (
                <p className="text-sm text-red-600 mt-0.5" role="alert">{passwordError}</p>
              )}
            </div>

            {generalError && (
              <p className="text-sm text-red-600 text-center" role="alert">{generalError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md bg-precision-coral hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 transition-opacity mt-1"
            >
              {loading ? <NLoader size="sm" /> : null}
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>

            <p className="text-xs text-steel-gray text-center mt-1">
              By creating an account you agree to our{' '}
              <a href="/legal/terms" className="text-precision-coral hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy" className="text-precision-coral hover:underline">Privacy Policy</a>.
            </p>

            <p className="text-sm text-center text-steel-gray">
              Already have an account?{' '}
              <a href="/login" className="text-precision-coral hover:underline font-medium">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
