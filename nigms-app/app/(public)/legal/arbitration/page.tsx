import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArbitrationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Arbitration Agreement
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 1, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Agreement to Arbitrate</h2>
            <p>
              By engaging the services of Nailed It General Maintenance Services (&quot;NIGMS,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated by Charles Willis, you (&quot;Client&quot;) agree that any dispute, claim, or controversy arising out of or relating to these Terms, our services, or any work performed shall be resolved exclusively through binding arbitration, rather than in court.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Scope of Arbitration</h2>
            <p>
              This arbitration agreement applies to all disputes between you and NIGMS, including but not limited to disputes about the quality of work performed, billing and payment disputes, property damage claims, and any other claims arising from the service relationship.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Arbitration Process</h2>
            <p>
              Arbitration shall be conducted by a single neutral arbitrator under the rules of the American Arbitration Association (AAA) or a mutually agreed-upon arbitration service. The arbitration shall take place in the county where the services were performed, unless both parties agree to a different location or to conduct the arbitration remotely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Costs and Fees</h2>
            <p>
              Each party shall bear its own costs and attorneys&apos; fees in connection with the arbitration, unless the arbitrator determines that a party has acted in bad faith, in which case the arbitrator may award costs and fees to the prevailing party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Class Action Waiver</h2>
            <p>
              You agree that any arbitration shall be conducted on an individual basis only, and not as a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Exceptions</h2>
            <p>
              Notwithstanding the foregoing, either party may seek emergency injunctive or other equitable relief from a court of competent jurisdiction to prevent irreparable harm pending the outcome of arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Governing Law</h2>
            <p>
              This arbitration agreement shall be governed by the Federal Arbitration Act and applicable state law. If any portion of this agreement is found unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Contact</h2>
            <p>
              For questions about this Arbitration Agreement, please contact NIGMS directly before initiating any arbitration proceeding.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
