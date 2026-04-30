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
      icon: <Users size={22} style={{ color: "var(--color-accent-orange)" }} />,
      subLabel: null,
    },
    {
      label: "Open Work Orders",
      value: openWorkOrders.toString(),
      panel: "workOrders" as const,
      icon: <ClipboardList size={22} style={{ color: "var(--color-accent-orange)" }} />,
      subLabel: null,
    },
    {
      label: "Total Revenue",
      value: formattedRevenue,
      panel: "revenue" as const,
      icon: <DollarSign size={22} style={{ color: "var(--color-accent-orange)" }} />,
      subLabel: null,
    },
    {
      label: "Messages",
      value: unreadMessages.toString(),
      panel: "messages" as const,
      icon: <MessageSquare size={22} style={{ color: "var(--color-accent-orange)" }} />,
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
              className="card card-accent cursor-pointer transition-all duration-150"
              style={
                isActive
                  ? {
                      borderColor: "var(--color-accent-orange)",
                      borderTopColor: "var(--color-accent-orange)",
                      background: "var(--color-navy)",
                      boxShadow: "0 0 0 1px var(--color-accent-orange), 0 4px 16px var(--color-accent-orange-glow)",
                    }
                  : undefined
              }
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  {card.icon}
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value mt-1">{card.value}</div>
                {card.subLabel && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--color-accent-orange)" }}
                  >
                    {card.subLabel}
                  </div>
                )}
              </div>
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
          <div className="p-6" style={{ color: "var(--color-text-secondary)" }}>
            Loading {activePanel ? panelTitles[activePanel] : ""}...
          </div>
        )}
      </SidePanel>
    </>
  );
}
