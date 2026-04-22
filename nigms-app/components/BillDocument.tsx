"use client";

import PrintButton from "@/components/PrintButton";
import type { Bill, WorkOrder, UserProfile } from "@/lib/types";

interface BillDocumentProps {
  bill: Bill;
  workOrder: WorkOrder;
  client: UserProfile;
}

export default function BillDocument({ bill, workOrder, client }: BillDocumentProps) {
  const clientName =
    client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : client.username;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(bill.created_at));

  const isPaidInFull = bill.balance_remaining === 0;

  return (
    <div className="print-section bg-white text-black p-8 max-w-2xl mx-auto">
      <div className="mb-4 no-print">
        <PrintButton />
      </div>

      {/* Company Header */}
      <div className="text-center mb-8 border-b border-gray-300 pb-6">
        <h1 className="text-2xl font-bold">NIGMS Construction Services</h1>
        <p className="text-gray-600">Rome, Georgia</p>
      </div>

      {/* Receipt Meta */}
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">RECEIPT / BILL</h2>
          <p className="text-gray-600">Receipt #: {bill.receipt_number}</p>
          <p className="text-gray-600">Date: {formattedDate}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{clientName}</p>
          {client.email && <p className="text-gray-600">{client.email}</p>}
          {client.phone && <p className="text-gray-600">{client.phone}</p>}
        </div>
      </div>

      {/* Work Order Reference */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <p className="font-medium">
          Work Order: {workOrder.wo_number ?? workOrder.title}
        </p>
        {workOrder.property_address && (
          <p className="text-gray-600">Property: {workOrder.property_address}</p>
        )}
      </div>

      {/* Cost Breakdown */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2 w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2">
              Materials ({bill.materials_paid_by === "company"
                ? "paid by contractor"
                : bill.materials_paid_by === "client"
                ? "paid by client"
                : "split"})
            </td>
            <td className="py-2 text-right">${bill.materials_cost.toFixed(2)}</td>
          </tr>
          {bill.materials_paid_by === "both" && (
            <tr className="border-b border-gray-200">
              <td className="py-2 pl-4 text-gray-600">Client portion of materials</td>
              <td className="py-2 text-right">${bill.client_materials_cost.toFixed(2)}</td>
            </tr>
          )}
          <tr className="border-b border-gray-200">
            <td className="py-2">Labor</td>
            <td className="py-2 text-right">${bill.labor_cost.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-56 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span>Total Billed</span>
            <span className="font-semibold">${bill.total_billed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span>Amount Paid</span>
            <span>${bill.amount_paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-1">
            <span className="font-bold">Balance</span>
            {isPaidInFull ? (
              <span className="font-bold text-green-600">PAID IN FULL</span>
            ) : (
              <span className="font-bold">${bill.balance_remaining.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
