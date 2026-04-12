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
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
        {formattedAmount}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
        {formattedDate}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={payment.status} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
        {methodLabel}
      </td>
    </tr>
  );
}
