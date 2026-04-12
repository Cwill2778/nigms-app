"use client";

import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import FormError from "./FormError";

interface PromoCodeInputProps {
  onApply: (code: string) => Promise<void>;
  disabled?: boolean;
}

export default function PromoCodeInput({ onApply, disabled }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onApply(code.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid promo code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setSuccess(false);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Promo code"
          disabled={disabled || loading}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleApply}
          disabled={disabled || loading || !code.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <LoadingSpinner size="sm" />}
          Apply
        </button>
      </div>

      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">Promo code applied!</p>
      )}
      <FormError message={error} />
    </div>
  );
}
