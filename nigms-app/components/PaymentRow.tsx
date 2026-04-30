import type { Payment } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface PaymentRowProps {
  payment: Payment;
}

export default function PaymentRow({ payment }: PaymentRowProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(payment.amount);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(payment.created_at));

  const methodLabel = payment.method === "stripe" ? "Stripe" : "Manual";

  return (
    <tr style={{ borderBottom: "1px solid var(--color-steel-dim)" }}>
      <td
        className="py-3 px-4 text-sm font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        {formattedAmount}
      </td>
      <td className="py-3 px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {formattedDate}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={payment.status} />
      </td>
      <td className="py-3 px-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {methodLabel}
      </td>
    </tr>
  );
}
