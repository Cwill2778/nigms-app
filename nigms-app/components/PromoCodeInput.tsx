"use client";

import { useState } from "react";
import VIPCelebration from "./VIPCelebration";

/**
 * PromoCodeInput
 *
 * Renders a "Have a Promo Code?" text link that expands an inline input field.
 * - Input styled with trust-navy border (#1B263B)
 * - "Apply" button in precision-coral (#FF7F7F) with white text
 * - Shows inline error for invalid / already-redeemed codes
 * - Shows VIPCelebration full-screen overlay on vip_bypass success
 * - Shows green confirmation message on discount success
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.9, 6.10
 */

interface PromoCodeInputProps {
  /** Called when a vip_bypass code is successfully redeemed */
  onVIPGranted?: () => void;
  /** Called when a discount code is successfully redeemed */
  onDiscountApplied?: (percentage: number) => void;
}

type ApplyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "vip_success" }
  | { status: "discount_success"; percentage: number };

export default function PromoCodeInput({
  onVIPGranted,
  onDiscountApplied,
}: PromoCodeInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [applyState, setApplyState] = useState<ApplyState>({ status: "idle" });
  const [showVIPCelebration, setShowVIPCelebration] = useState(false);

  function handleToggle() {
    setExpanded((prev) => !prev);
    setCode("");
    setApplyState({ status: "idle" });
  }

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setApplyState({ status: "loading" });

    try {
      // Step 1: validate
      const validateRes = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (validateRes.status === 409) {
        setApplyState({
          status: "error",
          message: "This promo code has already been redeemed on your account.",
        });
        return;
      }

      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setApplyState({
          status: "error",
          message: validateData.error ?? "Invalid or inactive promo code.",
        });
        return;
      }

      // Step 2: redeem
      const redeemRes = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (redeemRes.status === 409) {
        setApplyState({
          status: "error",
          message: "This promo code has already been redeemed on your account.",
        });
        return;
      }

      if (!redeemRes.ok) {
        const redeemData = await redeemRes.json();
        setApplyState({
          status: "error",
          message: redeemData.error ?? "Failed to redeem promo code.",
        });
        return;
      }

      const redeemData = await redeemRes.json();

      if (redeemData.code_type === "vip_bypass") {
        setApplyState({ status: "vip_success" });
        setShowVIPCelebration(true);
      } else {
        const pct: number = redeemData.discount_percentage ?? 0;
        setApplyState({ status: "discount_success", percentage: pct });
        onDiscountApplied?.(pct);
      }
    } catch {
      setApplyState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  function handleVIPComplete() {
    setShowVIPCelebration(false);
    onVIPGranted?.();
  }

  const isLoading = applyState.status === "loading";

  return (
    <>
      {/* VIP full-screen overlay (Requirement 6.7) */}
      {showVIPCelebration && <VIPCelebration onComplete={handleVIPComplete} />}

      <div className="font-body">
        {/* "Have a Promo Code?" toggle link (Requirement 6.1) */}
        {!expanded && (
          <button
            type="button"
            onClick={handleToggle}
            className="text-sm text-steel-gray underline underline-offset-2 hover:text-trust-navy transition-colors focus:outline-none focus:ring-2 focus:ring-trust-navy focus:ring-offset-1 rounded"
          >
            Have a Promo Code?
          </button>
        )}

        {/* Expanded inline input (Requirement 6.2) */}
        {expanded && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (applyState.status === "error") {
                    setApplyState({ status: "idle" });
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleApply()}
                placeholder="Enter promo code"
                disabled={isLoading}
                aria-label="Promo code"
                className="flex-1 rounded-md border-2 border-trust-navy bg-white px-3 py-2 text-sm text-trust-navy placeholder-steel-gray focus:outline-none focus:ring-2 focus:ring-precision-coral focus:ring-offset-1 disabled:opacity-50"
              />

              {/* Apply button — precision-coral background (Requirement 6.2) */}
              <button
                type="button"
                onClick={handleApply}
                disabled={isLoading || !code.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-precision-coral hover:bg-opacity-90 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-precision-coral focus:ring-offset-1"
              >
                {isLoading && (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                )}
                Apply
              </button>

              {/* Collapse link */}
              <button
                type="button"
                onClick={handleToggle}
                disabled={isLoading}
                aria-label="Cancel promo code"
                className="text-steel-gray hover:text-trust-navy text-lg leading-none focus:outline-none disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Inline error (Requirements 6.4, 6.10) */}
            {applyState.status === "error" && (
              <p role="alert" className="text-sm text-red-600">
                {applyState.message}
              </p>
            )}

            {/* Discount success confirmation (Requirement 6.9) */}
            {applyState.status === "discount_success" && (
              <p role="status" className="text-sm text-status-green font-medium">
                🎉 {applyState.percentage}% discount applied to your subscription!
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
