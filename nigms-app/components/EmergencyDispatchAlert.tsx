"use client";

/**
 * EmergencyDispatchAlert — prominent alert banner shown on the admin dashboard
 * when there are unread emergency_dispatch notifications.
 *
 * Fetches unread emergency_dispatch notifications from /api/notifications,
 * displays them as a prominent red alert banner, and allows the admin to
 * dismiss (mark as read) each alert.
 *
 * Uses Supabase Realtime to receive new emergency alerts in real time.
 *
 * Requirements: 8.9, 11.3
 */

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

interface EmergencyNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export default function EmergencyDispatchAlert() {
  const [alerts, setAlerts] = useState<EmergencyNotification[]>([]);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = (await res.json()) as { notifications?: EmergencyNotification[] };
      const all = json.notifications ?? [];
      const emergencyAlerts = all.filter((n) => n.type === "emergency_dispatch");
      setAlerts(emergencyAlerts);
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();

    // Subscribe to real-time inserts on the notifications table
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("emergency-dispatch-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "type=eq.emergency_dispatch",
        },
        () => {
          void fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  async function handleDismiss(notificationId: string) {
    setDismissing((prev) => new Set(prev).add(notificationId));
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
      setAlerts((prev) => prev.filter((a) => a.id !== notificationId));
    } catch {
      // Silently ignore
    } finally {
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md, 8px)",
            background: "rgba(239, 68, 68, 0.12)",
            border: "2px solid rgba(239, 68, 68, 0.6)",
            boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.08)",
          }}
        >
          {/* Alert icon */}
          <span
            style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1.2 }}
            aria-hidden="true"
          >
            🚨
          </span>

          {/* Alert content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "#EF4444",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {alert.title}
            </p>
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.875rem",
                color: "var(--color-text-primary, #e2e8f0)",
                lineHeight: 1.5,
              }}
            >
              {alert.body}
            </p>
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.75rem",
                color: "var(--color-text-muted, #778DA9)",
              }}
            >
              {new Date(alert.created_at).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => void handleDismiss(alert.id)}
            disabled={dismissing.has(alert.id)}
            aria-label="Dismiss emergency alert"
            style={{
              flexShrink: 0,
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm, 4px)",
              background: "transparent",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#EF4444",
              fontSize: "0.75rem",
              fontWeight: 700,
              fontFamily: "var(--font-heading, Montserrat, sans-serif)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: dismissing.has(alert.id) ? "wait" : "pointer",
              opacity: dismissing.has(alert.id) ? 0.6 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {dismissing.has(alert.id) ? "…" : "Dismiss"}
          </button>
        </div>
      ))}
    </div>
  );
}
