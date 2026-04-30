"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/StatusBadge";
import PayBalanceButton from "@/components/PayBalanceButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { WorkOrder, Payment, Estimate, Bill, ChangeOrder, Message } from "@/lib/types";

type Tab = "overview" | "estimate" | "bill" | "messages" | "changeOrders";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function ClientWorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUserId(user.id);

        // Fetch work order (RLS ensures client only sees their own)
        const { data: wo, error: woErr } = await supabase
          .from("work_orders")
          .select("*")
          .eq("id", id)
          .single();

        if (woErr || !wo) { setError("Work order not found."); return; }
        setWorkOrder(wo as WorkOrder);

        // Fetch related data in parallel
        const [
          { data: paymentsData },
          { data: estimateData },
          { data: billData },
          { data: changeOrdersData },
          { data: messagesData },
        ] = await Promise.all([
          supabase.from("payments").select("*").eq("work_order_id", id).order("created_at", { ascending: false }),
          supabase.from("estimates").select("*").eq("work_order_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("bills").select("*").eq("work_order_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("change_orders").select("*").eq("work_order_id", id).order("created_at", { ascending: false }),
          supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: true }),
        ]);

        setPayments((paymentsData ?? []) as Payment[]);
        setEstimate(estimateData as Estimate | null);
        setBill(billData as Bill | null);
        setChangeOrders((changeOrdersData ?? []) as ChangeOrder[]);
        // Filter messages to only those related to this work order's admin conversation
        setMessages((messagesData ?? []) as Message[]);
      } catch {
        setError("Failed to load work order details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleSendMessage() {
    if (!newMessage.trim() || !userId) return;
    setSendingMessage(true);
    try {
      const supabase = createBrowserClient();
      // Get admin user id — find the admin from users table
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (!adminUser) return;

      const { data: msg, error: msgErr } = await supabase.from("messages")
        .insert({
          sender_id: userId,
          recipient_id: (adminUser as { id: string }).id,
          sender_role: "client",
          body: newMessage.trim(),
        })
        .select()
        .single();

      if (!msgErr && msg) {
        setMessages((prev) => [...prev, msg as Message]);
        setNewMessage("");
      }
    } catch {
      // non-fatal
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error ?? "Work order not found."}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, (workOrder.quoted_amount ?? 0) - totalPaid);

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "estimate", label: "Estimate", show: estimate !== null },
    { key: "bill", label: "Bill", show: bill !== null },
    { key: "changeOrders", label: "Change Orders", show: changeOrders.length > 0 },
    { key: "messages", label: "Messages", show: true },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {workOrder.title}
          </h1>
          {workOrder.wo_number && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {workOrder.wo_number}
            </p>
          )}
        </div>
        <StatusBadge status={workOrder.status} />
      </div>

      {/* Outstanding balance CTA */}
      {outstanding > 0 && (
        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Outstanding Balance
            </p>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-200">
              {formatCurrency(outstanding)}
            </p>
          </div>
          <PayBalanceButton workOrderId={workOrder.id} amount={outstanding} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto gap-0">
          {tabs.filter((t) => t.show).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {workOrder.wo_number && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Work Order #</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{workOrder.wo_number}</dd>
                  </>
                )}
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd><StatusBadge status={workOrder.status} /></dd>
                {workOrder.category && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">{workOrder.category}</dd>
                  </>
                )}
                {workOrder.urgency && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Urgency</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">{workOrder.urgency}</dd>
                  </>
                )}
                {workOrder.property_address && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Property</dt>
                    <dd className="text-gray-900 dark:text-white">{workOrder.property_address}</dd>
                  </>
                )}
                {workOrder.quoted_amount != null && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Quoted Amount</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(workOrder.quoted_amount)}</dd>
                  </>
                )}
                <dt className="text-gray-500 dark:text-gray-400">Submitted</dt>
                <dd className="text-gray-900 dark:text-white">{formatDate(workOrder.created_at)}</dd>
                {workOrder.accepted_at && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Accepted</dt>
                    <dd className="text-gray-900 dark:text-white">{formatDate(workOrder.accepted_at)}</dd>
                  </>
                )}
                {workOrder.completed_at && (
                  <>
                    <dt className="text-gray-500 dark:text-gray-400">Completed</dt>
                    <dd className="text-gray-900 dark:text-white">{formatDate(workOrder.completed_at)}</dd>
                  </>
                )}
              </dl>

              {workOrder.description && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {workOrder.description}
                  </p>
                </div>
              )}
            </div>

            {/* Payment history */}
            {payments.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Payment History
                </h2>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {["Amount", "Date", "Method", "Status"].map((h) => (
                          <th key={h} className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">{formatCurrency(p.amount)}</td>
                          <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                            {p.payment_date ? formatDate(p.payment_date) : formatDate(p.created_at)}
                          </td>
                          <td className="py-2 px-4 text-gray-500 dark:text-gray-400 capitalize">{p.method}</td>
                          <td className="py-2 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : p.status === "failed"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estimate */}
        {activeTab === "estimate" && estimate && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Estimate #{estimate.estimate_number}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(estimate.created_at)}
              </span>
            </div>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Description</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Unit Price</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {estimate.line_items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-900 dark:text-white">{item.description}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                  <td colSpan={3} className="py-3 text-right font-semibold text-gray-900 dark:text-white">Total</td>
                  <td className="py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(estimate.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
            {estimate.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                {estimate.notes}
              </p>
            )}
          </div>
        )}

        {/* Bill */}
        {activeTab === "bill" && bill && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Receipt #{bill.receipt_number}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(bill.created_at)}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Labor Cost", formatCurrency(bill.labor_cost)],
                ["Materials Cost", formatCurrency(bill.materials_cost)],
                ["Total Billed", formatCurrency(bill.total_billed)],
                ["Amount Paid", formatCurrency(bill.amount_paid)],
              ].map(([label, value]) => (
                <>
                  <dt key={`dt-${label}`} className="text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd key={`dd-${label}`} className="text-gray-900 dark:text-white font-medium">{value}</dd>
                </>
              ))}
              <dt className="text-gray-500 dark:text-gray-400">Balance Remaining</dt>
              <dd className={`font-bold ${bill.balance_remaining === 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                {bill.balance_remaining === 0 ? "Paid in Full" : formatCurrency(bill.balance_remaining)}
              </dd>
            </dl>
          </div>
        )}

        {/* Change Orders */}
        {activeTab === "changeOrders" && (
          <div className="flex flex-col gap-3">
            {changeOrders.map((co) => (
              <div key={co.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-900 dark:text-white">{co.description}</p>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    co.status === "accepted"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : co.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {co.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                  Additional cost: {formatCurrency(co.additional_cost)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {activeTab === "messages" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto flex flex-col gap-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No messages yet. Send a message to get in touch with us.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.sender_role === "client";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${isClient ? "ml-auto items-end" : "items-start"}`}
                      >
                        <div className={`px-3 py-2 rounded-lg text-sm ${
                          isClient
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}>
                          {msg.body}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {isClient ? "You" : "NIGMS"} ·{" "}
                          {new Date(msg.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
                >
                  {sendingMessage ? <LoadingSpinner size="sm" /> : null}
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
