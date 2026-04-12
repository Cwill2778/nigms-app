"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoCodeInput from "@/components/PromoCodeInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import FormError from "@/components/FormError";

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

interface Step1Data {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  quotedAmount: string;
}

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>({
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    preferredDate: "",
    quotedAmount: "",
  });
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");
  const [depositWaived, setDepositWaived] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quotedAmount = parseFloat(step1.quotedAmount) || 0;
  const depositAmount = Math.round(quotedAmount * 0.15 * 100) / 100;

  function validateStep1(): boolean {
    if (!step1.name.trim()) { setStep1Error("Name is required."); return false; }
    if (!step1.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) {
      setStep1Error("A valid email address is required.");
      return false;
    }
    if (!step1.phone.trim()) { setStep1Error("Phone number is required."); return false; }
    if (!step1.serviceType) { setStep1Error("Please select a service type."); return false; }
    if (!step1.preferredDate) { setStep1Error("Preferred date is required."); return false; }
    if (!step1.quotedAmount || quotedAmount <= 0) {
      setStep1Error("Please enter a valid quoted amount.");
      return false;
    }
    setStep1Error(null);
    return true;
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  }

  async function handlePromoApply(code: string) {
    const res = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!data.valid) throw new Error("Invalid promo code.");
    if (data.waivesDeposit) setDepositWaived(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: step1.name,
          email: step1.email,
          phone: step1.phone,
          serviceType: step1.serviceType,
          preferredDate: step1.preferredDate,
          quotedAmount,
          paymentOption: depositWaived ? "deposit" : paymentOption,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      if (depositWaived) {
        // No payment needed — redirect to a success page
        window.location.href = "/book/success";
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Book a Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Step {step} of 2
        </p>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step
                  ? "bg-blue-600 dark:bg-blue-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={step1.name}
                onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                placeholder="Charles Willis"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={step1.email}
                onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={step1.phone}
                onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                placeholder="(555) 000-0000"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Type
              </label>
              <select
                value={step1.serviceType}
                onChange={(e) => setStep1({ ...step1, serviceType: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a service...</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                value={step1.preferredDate}
                onChange={(e) => setStep1({ ...step1, preferredDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quoted Amount ($)
              </label>
              <input
                type="number"
                value={step1.quotedAmount}
                onChange={(e) => setStep1({ ...step1, quotedAmount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <FormError message={step1Error} />

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Continue to Payment
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm space-y-1">
              <p className="font-medium text-gray-900 dark:text-white">{step1.serviceType}</p>
              <p className="text-gray-500 dark:text-gray-400">{step1.name} · {step1.preferredDate}</p>
              <p className="text-gray-700 dark:text-gray-300">
                Quoted: <strong>${quotedAmount.toFixed(2)}</strong>
              </p>
            </div>

            {/* Promo code */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Have a promo code?
              </p>
              <PromoCodeInput onApply={handlePromoApply} disabled={depositWaived} />
              {depositWaived && (
                <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                  Deposit waived — you can proceed without payment.
                </p>
              )}
            </div>

            {/* Payment options */}
            {!depositWaived && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Option
                </p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="deposit"
                      checked={paymentOption === "deposit"}
                      onChange={() => setPaymentOption("deposit")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Pay Deposit — ${depositAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        15% of quoted amount due now; remainder due on completion.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === "full"}
                      onChange={() => setPaymentOption("full")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Pay in Full — ${quotedAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Full amount due now.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <FormError message={submitError} />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {loading && <LoadingSpinner size="sm" />}
                {depositWaived ? "Confirm Booking" : "Proceed to Payment"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
