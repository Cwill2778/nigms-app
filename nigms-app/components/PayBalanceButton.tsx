"use client";

import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface PayBalanceButtonProps {
  workOrderId: string;
  amount: number;
}

export default function PayBalanceButton({
  workOrderId,
  amount,
}: PayBalanceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId, type: "balance", amount }),
      });

      if (!res.ok) {
        setError("Failed to initiate payment. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors w-fit"
      >
        {loading && <LoadingSpinner size="sm" />}
        {loading ? "Processing…" : `Pay Balance (${formattedAmount})`}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
