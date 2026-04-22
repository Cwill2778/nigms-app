"use client";

import PrintButton from "@/components/PrintButton";
import type { WorkOrder, UserProfile, Estimate } from "@/lib/types";

interface ICAgreementProps {
  workOrder: WorkOrder;
  client: UserProfile;
  estimate: Estimate | null;
}

export default function ICAgreement({ workOrder, client, estimate }: ICAgreementProps) {
  const clientName =
    client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : client.username;

  const today = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const propertyAddress = workOrder.property_address ?? "[Property Address]";
  const estimateTotal = estimate
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        estimate.total_amount
      )
    : "[Estimate Total]";

  return (
    <div className="print-section bg-white text-black p-8 max-w-2xl mx-auto font-serif">
      <div className="mb-6 no-print">
        <PrintButton />
      </div>

      {/* 1. Header */}
      <div className="text-center mb-8">
        <h1 className="text-lg font-bold uppercase leading-tight">
          Independent Contractor Agreement for Residential Remodeling Services
        </h1>
        <p className="mt-2 text-sm">Date: {today}</p>
        <p className="text-sm">Work Order: {workOrder.wo_number ?? workOrder.title}</p>
      </div>

      {/* 2. Parties */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">1. Parties</h2>
        <p className="text-sm leading-relaxed">
          This Agreement is entered into between NIGMS Construction Services
          (&ldquo;Contractor&rdquo;), located in Rome, Georgia, and{" "}
          <strong>{clientName}</strong> (&ldquo;Client&rdquo;), located at{" "}
          <strong>{propertyAddress}</strong>.
        </p>
      </section>

      {/* 3. Scope of Work */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">2. Scope of Work</h2>
        <p className="text-sm leading-relaxed">
          Contractor agrees to perform the following services as described in Work Order{" "}
          {workOrder.wo_number ?? workOrder.title}:{" "}
          {workOrder.description ?? "as detailed in the associated work order documentation"}.
          {estimate && (
            <> The estimated total for this work is <strong>{estimateTotal}</strong>.</>
          )}
        </p>
      </section>

      {/* 4. Compensation */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">3. Compensation</h2>
        <p className="text-sm leading-relaxed">
          Client agrees to pay Contractor the sum of{" "}
          <strong>{estimateTotal}</strong> for the services described herein.
          Payment is due upon completion of the work unless otherwise agreed in
          writing by both parties. Contractor reserves the right to require a
          deposit prior to commencement of work.
        </p>
      </section>

      {/* 5. Independent Contractor Status */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">4. Independent Contractor Status</h2>
        <p className="text-sm leading-relaxed">
          Contractor is an independent contractor and not an employee of Client.
          Contractor is solely responsible for all taxes, insurance, workers&apos;
          compensation, and other obligations arising from the performance of
          services under this Agreement. Nothing in this Agreement shall be
          construed to create an employer-employee relationship between the parties.
        </p>
      </section>

      {/* 6. Lien Rights */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">5. Lien Rights</h2>
        <p className="text-sm leading-relaxed">
          Contractor retains all lien rights under O.C.G.A. § 44-14-361 et seq.
          for all labor, services, and materials furnished in connection with the
          improvement of the above-referenced property. Client acknowledges that
          failure to pay amounts due under this Agreement may result in a
          materialman&apos;s lien or mechanic&apos;s lien being filed against the
          property. Such lien rights shall not be waived except by written
          instrument signed by Contractor.
        </p>
      </section>

      {/* 7. Dispute Resolution */}
      <section className="mb-6">
        <h2 className="font-bold text-base mb-2">6. Dispute Resolution</h2>
        <p className="text-sm leading-relaxed">
          Any disputes arising under this Agreement shall be resolved by binding
          arbitration in accordance with the rules of the American Arbitration
          Association, in Rome, Georgia.
        </p>
      </section>

      {/* 8. Signature Lines */}
      <section className="mt-10">
        <h2 className="font-bold text-base mb-6">7. Signatures</h2>
        <div className="grid grid-cols-2 gap-12">
          {/* Client */}
          <div>
            <p className="text-sm font-semibold mb-8">Client</p>
            <div className="border-b border-black mb-1">
              <span className="invisible">signature</span>
            </div>
            <p className="text-xs">Client Signature</p>
            <p className="text-xs mt-1">Date: ___________</p>
            <div className="border-b border-black mt-6 mb-1">
              <span className="invisible">name</span>
            </div>
            <p className="text-xs">Printed Name: ___________________________</p>
          </div>

          {/* Contractor */}
          <div>
            <p className="text-sm font-semibold mb-8">Contractor</p>
            <div className="border-b border-black mb-1">
              <span className="invisible">signature</span>
            </div>
            <p className="text-xs">Contractor Signature</p>
            <p className="text-xs mt-1">Date: ___________</p>
          </div>
        </div>
      </section>
    </div>
  );
}
