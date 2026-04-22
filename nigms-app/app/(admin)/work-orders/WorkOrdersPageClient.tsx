"use client";

import { useState } from "react";
import WorkOrderTable from "./WorkOrderTable";
import SidePanel from "@/components/SidePanel";
import WorkOrderDetailPanel from "@/components/WorkOrderDetailPanel";
import type { WorkOrder } from "@/lib/types";

interface WorkOrdersPageClientProps {
  workOrders: WorkOrder[];
}

export default function WorkOrdersPageClient({ workOrders }: WorkOrdersPageClientProps) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Work Orders</h1>

      <WorkOrderTable
        workOrders={workOrders}
        onViewWorkOrder={(id) => setSelectedWorkOrderId(id)}
      />

      <SidePanel
        open={selectedWorkOrderId !== null}
        onClose={() => setSelectedWorkOrderId(null)}
        title="Work Order Details"
        width="xl"
      >
        {selectedWorkOrderId && (
          <WorkOrderDetailPanel
            workOrderId={selectedWorkOrderId}
            onClose={() => setSelectedWorkOrderId(null)}
          />
        )}
      </SidePanel>
    </div>
  );
}
