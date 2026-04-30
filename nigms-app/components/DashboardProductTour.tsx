"use client";

import { useState } from "react";
import ProductTour from "@/components/ProductTour";

const TOUR_STEPS = [
  {
    title: "Welcome to your dashboard 👋",
    description:
      "This is your home base. You can track all your work orders, view payment history, and see your account summary at a glance.",
  },
  {
    title: "Submit a work order",
    description:
      'Click "New Order" in the sidebar to request maintenance or repairs. Describe what you need and we\'ll get back to you with a quote.',
  },
  {
    title: "Track your work orders",
    description:
      "Click any work order to see its full details — status, estimate, bill, change orders, and more. You can also pay your balance directly from there.",
  },
  {
    title: "Message us directly",
    description:
      'Use the "Messages" link in the sidebar to send us a message any time. We\'ll respond within one business day.',
  },
  {
    title: "You're all set!",
    description:
      "That's everything you need to know to get started. If you ever need help, just send us a message.",
  },
];

export default function DashboardProductTour() {
  const [visible, setVisible] = useState(true);

  async function handleComplete() {
    setVisible(false);
    try {
      await fetch("/api/client/tour-complete", { method: "POST" });
    } catch {
      // Non-fatal
    }
  }

  if (!visible) return null;

  return <ProductTour steps={TOUR_STEPS} onComplete={handleComplete} />;
}
