"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/OnboardingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import FormError from "@/components/FormError";

/**
 * Onboarding Step 2 — Nailed It Assurance Program subscription pitch
 *
 * "Upgrade" → POST /api/client/subscriptions/checkout with { tier: 'essential' }
 *             → redirect to Stripe checkout URL
 * "Skip to Dashboard" → PATCH /api/client/onboarding { onboarding_complete: true }
 *                     → redirect to /dashboard
 *
 * Promo code section:
 *   "Have a Promo Code?" expands inline input
 *   POST /api/promo/validate then POST /api/promo/redeem
 *   vip_bypass → VIP celebration overlay → /dashboard
 *   discount   → confirmation message → proceed with discounted checkout
 *
 * Requirements: 2.4, 2.5, 2.6, 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.9
 */

const FEATURES = [
  "60 min/month of covered service time",
  "Bi-annual seasonal prep",
  "10% discount on A La Carte work",
];

export default function AssurancePage() {
  const router = useRouter();
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo code state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showVIPOverlay, setShowVIPOverlay] = useState(false);

  async function handleUpgrade() {
    setError(null);
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/client/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "essential" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to start checkout. Please try again.");
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        setError("No checkout URL returned. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setSkipLoading(true);
    try {
      await fetch("/api/client/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_complete: true }),
      });
    } catch {
      // Non-fatal — proceed to dashboard regardless
    } finally {
      setSkipLoading(false);
    }
    router.push("/dashboard");
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setPromoSuccess(null);
    setPromoLoading(true);

    try {
      // Step 1: Validate
      const validateRes = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const validateData = await validateRes.json().catch(() => ({}));

      if (!validateRes.ok || !validateData.valid) {
        if (validateRes.status === 409) {
          setPromoError("This promo code has already been redeemed on your account.");
        } else {
          setPromoError(validateData.error ?? "Invalid promo code. Please check and try again.");
        }
        return;
      }

      // Step 2: Redeem
      const redeemRes = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const redeemData = await redeemRes.json().catch(() => ({}));

      if (!redeemRes.ok) {
        if (redeemRes.status === 409) {
          setPromoError("This promo code has already been redeemed on your account.");
        } else {
          setPromoError(redeemData.error ?? "Failed to apply promo code. Please try again.");
        }
        return;
      }

      if (validateData.code_type === "vip_bypass") {
        // Show VIP celebration overlay, then redirect to dashboard
        setShowVIPOverlay(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 4000);
      } else if (validateData.code_type === "discount") {
        const pct = validateData.discount_percentage ?? 0;
        setPromoSuccess(
          `Promo code applied! You'll receive ${pct}% off your subscription.`
        );
      } else {
        setPromoSuccess("Promo code applied successfully!");
      }
    } catch {
      setPromoError("An unexpected error occurred. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  // VIP Celebration Overlay
  if (showVIPOverlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: "#FF7F7F" }}
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-lg">
          <div className="text-6xl mb-6" aria-hidden="true">
            🎉
          </div>
          <h1
            className="text-3xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
          >
            VIP Access Granted.
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Welcome to the Elite Standard.
          </p>
          <p className="text-lg text-white/80">
            Your complimentary full-feature access is now active.
          </p>
          <p className="text-sm text-white/60 mt-8">
            Redirecting you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingCard maxWidth="lg" step={2} totalSteps={2}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: copy */}
        <div className="flex-1">
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: "#1B263B",
              fontFamily: "var(--font-heading), Montserrat, sans-serif",
            }}
          >
            Protect this asset with the Nailed It Assurance Program
          </h1>
          <p className="text-sm mb-6" style={{ color: "#778DA9" }}>
            Get guaranteed service time, seasonal prep, and member discounts — all
            for a flat monthly rate.
          </p>

          <ul className="flex flex-col gap-3 mb-6">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: "#FF7F7F" }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-sm" style={{ color: "#1B263B" }}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {error && (
            <p
              className="text-xs rounded-lg px-3 py-2 mb-4"
              style={{ color: "#FF7F7F", backgroundColor: "rgba(255,127,127,0.1)" }}
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading || skipLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg text-white text-sm font-semibold px-6 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FF7F7F" }}
            >
              {upgradeLoading && <LoadingSpinner size="sm" />}
              {upgradeLoading ? "Redirecting…" : "Upgrade — $149/mo"}
            </button>

            <button
              onClick={handleSkip}
              disabled={upgradeLoading || skipLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-6 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border"
              style={{ borderColor: "#1B263B", color: "#1B263B" }}
            >
              {skipLoading && <LoadingSpinner size="sm" />}
              {skipLoading ? "Redirecting…" : "Skip to Dashboard"}
            </button>
          </div>

          {/* Promo code section */}
          <div className="mt-6">
            {!promoExpanded ? (
              <button
                type="button"
                onClick={() => setPromoExpanded(true)}
                className="text-sm underline underline-offset-2 transition-colors"
                style={{ color: "#778DA9" }}
              >
                Have a Promo Code?
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="promo-code"
                  className="text-sm font-medium"
                  style={{ color: "#1B263B" }}
                >
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code"
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError(null);
                      setPromoSuccess(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    placeholder="Enter promo code"
                    disabled={promoLoading}
                    className="flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
                    style={{ borderColor: "#1B263B" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="flex items-center gap-2 rounded-lg text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#FF7F7F" }}
                  >
                    {promoLoading && <LoadingSpinner size="sm" />}
                    Apply
                  </button>
                </div>

                {promoSuccess && (
                  <p className="text-sm text-green-600" role="status">
                    {promoSuccess}
                  </p>
                )}
                <FormError message={promoError} />
              </div>
            )}
          </div>
        </div>

        {/* Right: pricing card */}
        <div className="lg:w-56 flex-shrink-0">
          <div
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: "#1B263B" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "#FF7F7F" }}
              >
                Essential Standard
              </p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-white">$149</span>
                <span className="text-sm mb-1" style={{ color: "#778DA9" }}>
                  /mo
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#778DA9" }}>
                Billed monthly. Cancel any time.
              </p>
            </div>

            <div
              className="border-t pt-4 flex flex-col gap-2"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: "#FF7F7F" }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}
