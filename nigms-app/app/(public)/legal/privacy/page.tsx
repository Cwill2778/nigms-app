import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 1, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Introduction</h2>
            <p>
              Nailed It General Maintenance Services (&quot;NIGMS,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Personal identification information (name, email address, phone number)</li>
              <li>Service address and property information</li>
              <li>Payment information (processed securely through Stripe — we do not store card details)</li>
              <li>Communication records between you and NIGMS</li>
              <li>Usage data and cookies from our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Schedule and perform requested services</li>
              <li>Process payments and send receipts</li>
              <li>Communicate about your work orders and account</li>
              <li>Send newsletters and promotional updates (with your consent)</li>
              <li>Improve our services and website</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers (such as Stripe for payment processing and Resend for email delivery) solely to operate our business. These providers are contractually obligated to keep your information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including encrypted connections (HTTPS), secure database storage with row-level security, and HTTP-only session cookies. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us directly. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Cookies</h2>
            <p>
              Our website uses cookies to maintain your session and remember your preferences (such as dark/light mode). You can disable cookies in your browser settings, but this may affect the functionality of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact NIGMS directly. We are committed to addressing your concerns promptly.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
