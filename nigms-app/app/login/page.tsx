"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import NLoader from "@/components/NLoader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get("signup") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid email or password.");
        return;
      }

      const data = await res.json() as {
        role: string;
        requires_password_reset: boolean;
        onboarding_complete: boolean | null;
      };

      // Role-based redirect
      if (data.role === "admin") {
        router.push("/admin-dashboard");
      } else if (data.requires_password_reset) {
        router.push("/update-password");
      } else if (data.onboarding_complete === false) {
        // Client hasn't finished onboarding — send to first onboarding step
        router.push("/property");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <Logo />
      </div>

      <h1 className="text-2xl font-bold text-trust-navy mb-2 text-center font-heading">
        Sign in to your account
      </h1>
      <p className="text-sm text-steel-gray text-center mb-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-precision-coral hover:underline font-medium">
          Create one
        </Link>
      </p>

      {justSignedUp && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
          Account created! Sign in below.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-trust-navy"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-precision-coral"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-trust-navy"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-precision-coral"
            placeholder="Your password"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-architectural-gray">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
