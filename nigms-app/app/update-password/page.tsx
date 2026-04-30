"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import NLoader from "@/components/NLoader";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verify the user is authenticated on mount
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError("Password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();

      // Update the password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Clear the requires_password_reset flag via API route (uses service role)
      const res = await fetch("/api/auth/clear-reset-flag", { method: "POST" });
      if (!res.ok) {
        setError("Failed to complete password reset. Please try again.");
        return;
      }

      // Redirect to client dashboard after successful password update
      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-architectural-gray">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold text-trust-navy mb-2 text-center font-heading">
            Set your password
          </h1>
          <p className="text-sm text-steel-gray text-center mb-6">
            You must set a permanent password before continuing.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-trust-navy"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-precision-coral"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-trust-navy"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-precision-coral"
                  placeholder="Re-enter your password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-md bg-precision-coral hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-opacity"
              >
                {loading ? <NLoader size="sm" /> : null}
                {loading ? "Saving…" : "Set Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
