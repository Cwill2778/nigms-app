"use client";

import { useState } from "react";
import FormError from "@/components/FormError";
import LoadingSpinner from "@/components/LoadingSpinner";

const SERVICE_TYPES = [
  "General Repairs",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Flooring",
  "Drywall",
  "Pressure Washing",
  "Gutter Cleaning",
  "Other",
];

const REFERRAL_SOURCES = [
  "Google Search",
  "Facebook",
  "Instagram",
  "Word of Mouth / Friend",
  "Nextdoor",
  "Flyer / Mailer",
  "Returning Customer",
  "Other",
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  propertyAddress: string;
  budgetEstimate: string;
  referralSource: string;
  referralCode: string;
  notes: string;
  agreedToTerms: boolean;
}

const EMPTY: FormData = {
  name: "",
  email: "",
  phone: "",
  serviceType: "",
  preferredDate: "",
  propertyAddress: "",
  budgetEstimate: "",
  referralSource: "",
  referralCode: "",
  notes: "",
  agreedToTerms: false,
};

export default function BookPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    if (!form.name.trim()) { setError("Full name is required."); return false; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("A valid email address is required."); return false;
    }
    if (!form.phone.trim()) { setError("Phone number is required."); return false; }
    if (!form.serviceType) { setError("Please select a service type."); return false; }
    if (!form.preferredDate) { setError("Preferred date is required."); return false; }
    if (!form.propertyAddress.trim()) { setError("Property address is required."); return false; }
    if (!form.budgetEstimate.trim()) { setError("Budget estimate is required."); return false; }
    if (!form.referralSource) { setError("Please tell us how you heard about us."); return false; }
    if (!form.agreedToTerms) { setError("You must agree to the Terms of Service to continue."); return false; }
    setError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center border-2 border-[#4A4A4A] p-10 bg-white dark:bg-gray-900">
          <div className="text-5xl mb-4">🔨</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Quote Request Received!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Thanks, <strong>{form.name}</strong>. We&apos;ll review your request and get back to you within 1–2 business days with a quote.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Request a Free Quote
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          No payment required. Fill out the form below and we&apos;ll get back to you within 1–2 business days.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-orange-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-orange-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Type <span className="text-orange-500">*</span>
            </label>
            <select
              value={form.serviceType}
              onChange={(e) => set("serviceType", e.target.value)}
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select a service...</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preferred Service Date <span className="text-orange-500">*</span>
            </label>
            <input
              type="date"
              value={form.preferredDate}
              onChange={(e) => set("preferredDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Property Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property Address to be Serviced <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={form.propertyAddress}
              onChange={(e) => set("propertyAddress", e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Budget Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Estimate <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={form.budgetEstimate}
              onChange={(e) => set("budgetEstimate", e.target.value)}
              placeholder="e.g. $500 – $1,000"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* How did you hear about us */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              How Did You Hear About Us? <span className="text-orange-500">*</span>
            </label>
            <select
              value={form.referralSource}
              onChange={(e) => set("referralSource", e.target.value)}
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select an option...</option>
              {REFERRAL_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Referral Code (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Referral Code <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.referralCode}
              onChange={(e) => set("referralCode", e.target.value)}
              placeholder="Enter referral code if you have one"
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Describe the work needed, any special considerations, etc."
              rows={4}
              className="w-full border-2 border-[#4A4A4A] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Terms of Service */}
          <div className="border-2 border-[#4A4A4A] bg-gray-50 dark:bg-gray-800/50 p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              By submitting this form, you agree to our{" "}
              <a href="/legal/terms" target="_blank" className="text-orange-500 hover:underline font-medium">
                Terms of Service
              </a>
              ,{" "}
              <a href="/legal/privacy" target="_blank" className="text-orange-500 hover:underline font-medium">
                Privacy Policy
              </a>
              , and{" "}
              <a href="/legal/data-use" target="_blank" className="text-orange-500 hover:underline font-medium">
                Data Use Policy
              </a>
              . Submitting a quote request does not constitute a binding contract or guarantee of service.
              Nailed It General Maintenance Services reserves the right to decline any request. A representative
              will contact you to confirm details before any work is scheduled.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreedToTerms}
                onChange={(e) => set("agreedToTerms", e.target.checked)}
                className="mt-0.5 accent-orange-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I have read and agree to the Terms of Service, Privacy Policy, and Data Use Policy.{" "}
                <span className="text-orange-500">*</span>
              </span>
            </label>
          </div>

          <FormError message={error} />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold uppercase tracking-widest transition-colors border-2 border-orange-600"
          >
            {loading && <LoadingSpinner size="sm" />}
            Submit Quote Request
          </button>
        </form>
      </main>
  );
}
