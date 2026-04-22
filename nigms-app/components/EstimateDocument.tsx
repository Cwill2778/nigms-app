"use client";

import PrintButton from "@/components/PrintButton";
import type { Estimate, WorkOrder, UserProfile } from "@/lib/types";

interface EstimateDocumentProps {
  estimate: Estimate;
  workOrder: WorkOrder;
  client: UserProfile;
}

export default function EstimateDocument({
  estimate,
  workOrder,
  client,
}: EstimateDocumentProps) {
  const clientName =
    client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : client.username;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(estimate.created_at));

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

      {/* Estimate Meta */}
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">ESTIMATE</h2>
          <p className="text-gray-600">#{estimate.estimate_number}</p>
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
        <p className="font-medium">Work Order: {workOrder.wo_number ?? workOrder.title}</p>
        {workOrder.property_address && (
          <p className="text-gray-600">Property: {workOrder.property_address}</p>
        )}
        {workOrder.description && (
          <p className="text-gray-600 mt-1">{workOrder.description}</p>
        )}
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2 w-16">Qty</th>
            <th className="text-right py-2 w-24">Unit Price</th>
            <th className="text-right py-2 w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {estimate.line_items.map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">${item.unit_price.toFixed(2)}</td>
              <td className="py-2 text-right">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      {estimate.notes && (
        <div className="mb-4 text-sm text-gray-600 italic">
          <p>Notes: {estimate.notes}</p>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-end">
        <div className="w-48">
          <div className="flex justify-between border-t-2 border-gray-800 pt-2">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">
              ${estimate.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
