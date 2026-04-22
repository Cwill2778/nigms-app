"use client";

import { useState } from "react";
import ClientTable from "./ClientTable";
import AddClientForm from "./AddClientForm";
import SidePanel from "@/components/SidePanel";
import ClientDetailPanel from "@/components/ClientDetailPanel";
import type { UserProfile } from "@/lib/types";

interface ClientsPageClientProps {
  clients: UserProfile[];
}

export default function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
      </div>

      <AddClientForm />
      <ClientTable
        clients={clients}
        onViewClient={(id) => setSelectedClientId(id)}
      />

      <SidePanel
        open={selectedClientId !== null}
        onClose={() => setSelectedClientId(null)}
        title="Client Details"
        width="xl"
      >
        {selectedClientId && (
          <ClientDetailPanel
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
          />
        )}
      </SidePanel>
    </div>
  );
}
