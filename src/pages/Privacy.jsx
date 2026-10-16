import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';

function Privacy() {
  useScrollReveal();
  usePageMeta(
    'Privacy Policy | Nailed It Property Solutions',
    'Review the privacy policy and data security practices of Nailed It Property Solutions LLC in Rome, GA.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 page-fade-in text-white">
      <section className="text-center mb-16 reveal">
        <h1 className="text-4xl md:text-6xl text-white font-heading font-bold uppercase tracking-wider mb-6">
          Privacy Policy
        </h1>
        <div className="h-1 w-20 bg-brand-gold mx-auto mb-6"></div>
        <p className="text-lg text-[#a0a0a0] max-w-2xl mx-auto">
          How Nailed It Property Solutions protects your personal, property, and billing information.
        </p>
      </section>

      <section className="bg-[#111111] p-8 md:p-12 rounded-xl border border-white/10 shadow-[8px_8px_16px_rgba(0,0,0,0.6)] reveal space-y-8 leading-relaxed text-sm text-[#ccc]">
        <div className="border-b border-white/10 pb-4">
          <p className="text-xs text-brand-gold font-mono uppercase tracking-widest">
            Last Updated: October 2026 &bull; Nailed It Property Solutions LLC
          </p>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">1. Information We Collect</h2>
          <p className="mb-2">
            When you register for an account, request service via &ldquo;Name Your Price,&rdquo; or enroll in a maintenance subscription, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#a0a0a0]">
            <li><strong>Contact Details:</strong> Your name, email address, and telephone number.</li>
            <li><strong>Property Information:</strong> Residential or commercial service addresses, gate codes, and access notes.</li>
            <li><strong>Maintenance Records &amp; Assets:</strong> Equipment model/serial numbers, service history, and uploaded diagnostic photos.</li>
            <li><strong>Billing Data:</strong> Payment details are processed securely and tokenized directly by Stripe; we never store raw credit card numbers on our servers.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">2. How We Use Your Information</h2>
          <p className="mb-2">Your information is used strictly to deliver and verify property services, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#a0a0a0]">
            <li>Dispatching certified technicians to your address for scheduled appointments.</li>
            <li>Tracking and maintaining your property's permanent maintenance log (The Vault).</li>
            <li>Communicating quote estimates, work order status changes, and invoices.</li>
            <li>Fulfilling subscription preventative care schedules.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">3. We Never Sell Your Data</h2>
          <p>
            Nailed It Property Solutions maintains a strict zero-sale policy. We do not sell, rent, license, or monetize your personal details, property logs, or photos to third-party data brokers, marketers, or advertisers under any circumstances.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">4. Data Security &amp; Storage</h2>
          <p>
            All account authentication and database transmissions are secured using enterprise-grade TLS 1.3 encryption and Row-Level Security (RLS) protocols. Access to your property dossier and equipment registry is restricted solely to you and authorized Nailed It service personnel.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">5. Your Rights &amp; Account Control</h2>
          <p>
            You retain the right to review, update, or remove your registered properties and equipment assets at any time through your Customer Command Portal. To request complete deletion of your account and service records, contact our privacy officer at <a href="mailto:charles@naileditpropertysolutions.com" className="text-brand-gold hover:underline">charles@naileditpropertysolutions.com</a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold uppercase text-brand-gold mb-3">6. Contact Our Team</h2>
          <p className="text-xs text-[#a0a0a0]">
            Nailed It Property Solutions LLC<br />
            Floyd County &bull; Rome, GA<br />
            Phone: (706) 237-8184<br />
            Email: <a href="mailto:info@naileditpropertysolutions.com" className="text-brand-gold hover:underline">info@naileditpropertysolutions.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Privacy;
