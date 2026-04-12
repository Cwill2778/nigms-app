import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Terms of Use
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 1, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the NIGMS website and services, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, clients, and others who access or use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Services</h2>
            <p>
              Nailed It General Maintenance Services provides handyman, repair, and general maintenance services. All services are subject to availability and scheduling. NIGMS reserves the right to refuse service to anyone for any lawful reason.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Booking and Payment</h2>
            <p>
              Service bookings require a deposit of 15% of the quoted amount, or full payment at the time of booking. All payments are processed securely through Stripe. Quoted amounts are estimates and may be adjusted based on the actual scope of work discovered on-site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Cancellation Policy</h2>
            <p>
              Cancellations made more than 48 hours before the scheduled service date are eligible for a full refund of the deposit. Cancellations within 48 hours of the scheduled service may forfeit the deposit. NIGMS reserves the right to cancel or reschedule services due to weather, equipment failure, or other unforeseen circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Liability Limitation</h2>
            <p>
              NIGMS shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our total liability for any claim shall not exceed the amount paid for the specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Client Responsibilities</h2>
            <p>
              Clients are responsible for providing accurate information about the scope of work, ensuring safe access to the work area, and securing pets and valuables before service personnel arrive. Clients must be present or designate an authorized representative during service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, and images, is the property of NIGMS and is protected by applicable intellectual property laws. You may not reproduce or distribute any content without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Changes to Terms</h2>
            <p>
              NIGMS reserves the right to modify these Terms of Use at any time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. Governing Law</h2>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of the state in which NIGMS operates, without regard to conflict of law principles.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
