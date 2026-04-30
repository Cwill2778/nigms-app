"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/OnboardingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import FormError from "@/components/FormError";

/**
 * Onboarding Step 2 — Promo code entry + complete onboarding.
 *
 * "Go to Dashboard" → PATCH /api/client/onboarding { onboarding_complete: true }
 *                   → redirect to /dashboard
 *
 * Promo code:
 *   POST /api/promo/validate then POST /api/promo/redeem
 *   vip_bypass → VIP celebration overlay → /dashboard
 *
 * Requirements: 2.4, 2.5, 2.6, 6.1, 6.2, 6.3, 6.4, 6.6, 6.7
 */

export default function AssurancePage() {
  const router = useRouter();
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo code state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showVIPOverlay, setShowVIPOverlay] = useState(false);

  async function handleComplete() {
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
        setShowVIPOverlay(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3500);
      } else {
        const pct = validateData.discount_percentage ?? 0;
        setPromoSuccess(
          pct > 0
            ? `Promo code applied! You'll receive ${pct}% off.`
            : "Promo code applied successfully!"
        );
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
          <div className="text-6xl mb-6" aria-hidden="true">🎉</div>
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
    <OnboardingCard step={2} totalSteps={2}>
      <h1
        className="text-2xl font-bold mb-2"
        style={{
          color: "#1B263B",
          fontFamily: "var(--font-heading), Montserrat, sans-serif",
        }}
      >
        You&apos;re all set!
      </h1>
      <p className="text-sm mb-8" style={{ color: "#778DA9" }}>
        Your account is ready. Head to your dashboard to submit work orders,
        track projects, and message us directly.
      </p>

      {error && (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-4"
          style={{ color: "#FF7F7F", backgroundColor: "rgba(255,127,127,0.1)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleComplete}
          disabled={skipLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg text-white text-sm font-semibold px-6 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#FF7F7F" }}
        >
          {skipLoading && <LoadingSpinner size="sm" />}
          {skipLoading ? "Redirecting…" : "Go to Dashboard"}
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
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                  setPromoSuccess(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && !promoLoading && handleApplyPromo()}
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
    </OnboardingCard>
  );
}
