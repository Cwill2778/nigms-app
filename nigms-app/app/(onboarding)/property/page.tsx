"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/OnboardingCard";
import FormError from "@/components/FormError";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase-browser";

/**
 * Onboarding Step 1 — Property address input
 *
 * On submit:
 *   1. POST /api/client/properties with { address }
 *   2. PATCH /api/client/onboarding to set onboarding_step = 'assurance_upsell'
 *   3. Redirect to /assurance
 *
 * Requirements: 2.3, 2.4, 7.13, 7.14
 */

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface PropertyForm {
  street: string;
  city: string;
  state: string;
  zip: string;
}

const EMPTY: PropertyForm = { street: "", city: "", state: "GA", zip: "" };

export default function PropertySetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<PropertyForm>(EMPTY);
  const [existingProperties, setExistingProperties] = useState<
    { id: string; address: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Pre-fill if they already have a property saved (e.g. refreshed mid-flow)
  useEffect(() => {
    async function loadExisting() {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("properties")
          .select("id, address")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (data && data.length > 0) {
          setExistingProperties(data);
        }
      } catch {
        // non-fatal
      } finally {
        setInitializing(false);
      }
    }
    loadExisting();
  }, []);

  function set(field: keyof PropertyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  function validate(): boolean {
    if (!form.street.trim()) {
      setError("Street address is required.");
      return false;
    }
    if (!form.city.trim()) {
      setError("City is required.");
      return false;
    }
    if (!form.state) {
      setError("State is required.");
      return false;
    }
    if (!form.zip.trim()) {
      setError("ZIP code is required.");
      return false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      setError("Please enter a valid ZIP code (e.g. 30301).");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const address = `${form.street.trim()}, ${form.city.trim()}, ${form.state} ${form.zip.trim()}`;

    setLoading(true);
    try {
      // Step 1: Create the property
      const res = await fetch("/api/client/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("This property address is already associated with your account.");
        } else {
          setError(data.error ?? "Failed to save property. Please try again.");
        }
        return;
      }

      // Step 2: Advance onboarding step
      await fetch("/api/client/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_step: "assurance_upsell" }),
      });

      router.push("/assurance");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    // If they already have a property, allow skipping to assurance
    await fetch("/api/client/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_step: "assurance_upsell" }),
    }).catch(() => {});
    router.push("/assurance");
  }

  if (initializing) {
    return (
      <OnboardingCard step={1} totalSteps={2}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </OnboardingCard>
    );
  }

  return (
    <OnboardingCard step={1} totalSteps={2}>
      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "#1B263B", fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
      >
        Where do you need work done?
      </h1>
      <p className="text-sm mb-8" style={{ color: "#778DA9" }}>
        Add your primary service address so we can schedule and quote faster.
      </p>

      {/* Already saved properties */}
      {existingProperties.length > 0 && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            ✓ Property already saved
          </p>
          {existingProperties.map((p) => (
            <p key={p.id} className="text-sm text-green-700">
              {p.address}
            </p>
          ))}
          <p className="text-xs text-green-600 mt-2">
            You can add another below, or continue to the next step.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Street */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="street"
            className="text-sm font-medium"
            style={{ color: "#1B263B" }}
          >
            Street Address{" "}
            <span style={{ color: "#FF7F7F" }} aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="street"
            type="text"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              borderColor: "#778DA9",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "#FF7F7F",
            }}
            placeholder="123 Main Street"
            autoComplete="street-address"
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="city"
              className="text-sm font-medium"
              style={{ color: "#1B263B" }}
            >
              City{" "}
              <span style={{ color: "#FF7F7F" }} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ borderColor: "#778DA9" }}
              placeholder="Atlanta"
              autoComplete="address-level2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="state"
              className="text-sm font-medium"
              style={{ color: "#1B263B" }}
            >
              State{" "}
              <span style={{ color: "#FF7F7F" }} aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="state"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
              style={{ borderColor: "#778DA9" }}
              autoComplete="address-level1"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ZIP */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="zip"
            className="text-sm font-medium"
            style={{ color: "#1B263B" }}
          >
            ZIP Code{" "}
            <span style={{ color: "#FF7F7F" }} aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ borderColor: "#778DA9" }}
            placeholder="30301"
            maxLength={10}
            autoComplete="postal-code"
          />
        </div>

        <FormError message={error} />

        <div className="flex items-center justify-between pt-2">
          {existingProperties.length > 0 ? (
            <button
              type="button"
              onClick={handleContinue}
              className="text-sm transition-colors"
              style={{ color: "#778DA9" }}
            >
              Continue →
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg text-white text-sm font-semibold px-6 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#FF7F7F" }}
          >
            {loading && <LoadingSpinner size="sm" />}
            {loading
              ? "Saving…"
              : existingProperties.length > 0
              ? "Add Another & Continue"
              : "Save & Continue"}
          </button>
        </div>
      </form>
    </OnboardingCard>
  );
}
