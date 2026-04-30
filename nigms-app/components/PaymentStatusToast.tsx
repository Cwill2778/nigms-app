"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentStatusToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const enrolled = searchParams.get("enrolled");
    const onboarding = searchParams.get("onboarding");

    if (payment === "success") {
      setMessage({ text: "Payment received — thank you!", type: "success" });
    } else if (payment === "cancelled") {
      setMessage({ text: "Payment was cancelled. No charge was made.", type: "info" });
    } else if (enrolled === "assurance") {
      setMessage({ text: "Welcome to the Assurance Program! You're all set.", type: "success" });
    } else if (onboarding === "complete") {
      setMessage({ text: "Welcome! Your account is ready. Let's get started.", type: "success" });
    }

    if (payment || enrolled || onboarding) {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("enrolled");
      url.searchParams.delete("onboarding");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300",
  };

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium transition-all ${colors[message.type]}`}
    >
      <span>
        {message.type === "success" ? "✓" : message.type === "info" ? "ℹ" : "✕"}
      </span>
      {message.text}
      <button
        onClick={() => setMessage(null)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
