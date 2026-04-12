import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DataUsePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          How We Use and Collect Your Data
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 1, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Overview</h2>
            <p>
              This page provides a plain-language explanation of what data Nailed It General Maintenance Services collects, why we collect it, and how it is used. We believe in transparency and want you to feel confident about how your information is handled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4">When You Book a Service</h3>
            <p>
              We collect your name, email address, phone number, service type, and preferred date. This information is used solely to schedule and fulfill your service request and to communicate with you about your booking.
            </p>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4">When You Create an Account</h3>
            <p>
              Client accounts are created by NIGMS on your behalf. We store your username, email address, and account status. Passwords are hashed and never stored in plain text. You will be required to set your own password upon first login.
            </p>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4">When You Make a Payment</h3>
            <p>
              Payments are processed by Stripe. We do not store your credit card number, CVV, or full card details. We retain a record of the payment amount, date, and method for accounting and service history purposes.
            </p>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4">When You Subscribe to Our Newsletter</h3>
            <p>
              We collect your email address to send you updates about NIGMS services and promotions. You can unsubscribe at any time by contacting us or clicking the unsubscribe link in any email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service delivery:</strong> Scheduling, performing, and following up on maintenance services.</li>
              <li><strong>Billing:</strong> Processing payments, issuing receipts, and maintaining payment records.</li>
              <li><strong>Communication:</strong> Sending booking confirmations, status updates, and payment receipts via email.</li>
              <li><strong>Account management:</strong> Maintaining your client portal, work order history, and payment history.</li>
              <li><strong>Marketing (opt-in only):</strong> Sending newsletters and promotional content to subscribers who have opted in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Retention</h2>
            <p>
              We retain your personal data for as long as necessary to provide services and comply with legal obligations. Work order and payment records are retained for a minimum of 7 years for accounting purposes. Newsletter subscriber data is retained until you unsubscribe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Third-Party Services</h2>
            <p>We use the following third-party services to operate our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Secure database and authentication hosting.</li>
              <li><strong>Stripe:</strong> Payment processing. Subject to Stripe&apos;s own privacy policy.</li>
              <li><strong>Resend:</strong> Transactional email delivery. Subject to Resend&apos;s own privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Choices</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time by contacting NIGMS. We will process your request within 30 days. Note that some data may be retained for legal or accounting purposes even after a deletion request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Questions</h2>
            <p>
              If you have any questions about how we collect or use your data, please reach out to us directly. We are happy to explain our practices in more detail.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
