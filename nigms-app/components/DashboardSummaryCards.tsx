"use client";

import { useState } from "react";
import { Users, ClipboardList, DollarSign, MessageSquare } from "lucide-react";
import SidePanel from "@/components/SidePanel";
import MessagingPanel from "@/components/MessagingPanel";

interface DashboardSummaryCardsProps {
  totalClients: number;
  openWorkOrders: number;
  totalRevenue: number;
  unreadMessages: number;
  adminUserId: string;
}

type ActivePanel = "clients" | "workOrders" | "revenue" | "messages" | null;

const panelTitles: Record<Exclude<ActivePanel, null>, string> = {
  clients: "Clients",
  workOrders: "Work Orders",
  revenue: "Revenue",
  messages: "Messages",
};

export default function DashboardSummaryCards({
  totalClients,
  openWorkOrders,
  totalRevenue,
  unreadMessages,
  adminUserId,
}: DashboardSummaryCardsProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalRevenue);

  const cards = [
    {
      label: "Total Clients",
      value: totalClients.toString(),
      panel: "clients" as const,
      icon: <Users size={24} className="text-orange-500" />,
      subLabel: null,
    },
    {
      label: "Open Work Orders",
      value: openWorkOrders.toString(),
      panel: "workOrders" as const,
      icon: <ClipboardList size={24} className="text-orange-500" />,
      subLabel: null,
    },
    {
      label: "Total Revenue",
      value: formattedRevenue,
      panel: "revenue" as const,
      icon: <DollarSign size={24} className="text-orange-500" />,
      subLabel: null,
    },
    {
      label: "Messages",
      value: unreadMessages.toString(),
      panel: "messages" as const,
      icon: <MessageSquare size={24} className="text-orange-500" />,
      subLabel: unreadMessages > 0 ? "unread" : null,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const isActive = activePanel === card.panel;
          return (
            <div
              key={card.panel}
              onClick={() => setActivePanel(card.panel)}
              className={`rounded-lg border p-6 cursor-pointer transition-colors
                ${
                  isActive
                    ? "border-orange-500 bg-[#162d5e]"
                    : "border-[#4A4A4A] bg-[#0d2347] hover:border-orange-500 hover:bg-[#162d5e]"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                {card.icon}
              </div>
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{card.value}</p>
              {card.subLabel && (
                <p className="text-xs text-orange-400 mt-1">{card.subLabel}</p>
              )}
            </div>
          );
        })}
      </div>

      <SidePanel
        open={activePanel !== null}
        onClose={() => setActivePanel(null)}
        title={activePanel ? panelTitles[activePanel] : ""}
        width="xl"
      >
        {activePanel === "messages" ? (
          <MessagingPanel adminUserId={adminUserId} />
        ) : (
          <div className="p-6 text-gray-300">
            Loading {activePanel ? panelTitles[activePanel] : ""}...
          </div>
        )}
      </SidePanel>
    </>
  );
}
