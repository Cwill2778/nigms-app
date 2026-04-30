"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print btn-secondary inline-flex items-center gap-2"
    >
      <Printer size={15} />
      Print
    </button>
  );
}
