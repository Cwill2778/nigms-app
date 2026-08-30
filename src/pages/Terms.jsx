import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';

function Terms() {
  useScrollReveal();
  usePageMeta(
    'Terms of Use & Policy Updates | Nailed It Property Solutions',
    'Review the terms of use, submission policies, and legal disclosures for Nailed It Property Solutions in Rome, GA.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 page-fade-in">
      <section className="text-center mb-16 reveal">
        <h1 className="text-4xl md:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Terms &amp; Policies</h1>
        <p className="text-lg text-text-sub max-w-2xl mx-auto">
          This page contains all legal terms, policies, and disclosures governing
          your use of the Nailed It Property Solutions website and services.
        </p>
      </section>

      <section className="bg-wood-800 p-8 md:p-12 rounded-xl border border-wood-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] reveal" id="name-your-price-terms">
        <h2 className="text-2xl md:text-3xl text-brand-orange font-heading font-bold uppercase tracking-wider mb-4 border-b border-border-subtle pb-4">Terms of Submission for &ldquo;Name Your Price&rdquo; Requests</h2>
        <p className="text-sm text-text-sub font-heading tracking-widest uppercase mb-8">Last Updated: June 26, 2026</p>
        
        <div className="space-y-6 text-text-main leading-relaxed">
          <p>
            By clicking &ldquo;Submit,&rdquo; &ldquo;Send Bid,&rdquo; or otherwise submitting the
            Name Your Price form, you (the &ldquo;Customer&rdquo;) expressly agree to the following
            terms and conditions set forth by Nailed It Property Solutions (the &ldquo;Company&rdquo;).
            Please read these terms carefully before submitting your request.
          </p>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">1. Nature of the Submission</h3>
            <p className="mb-2">
              <strong>1.1 Not a Binding Contract:</strong> The submission of this form, including any
              proposed price, job description, or uploaded media, does not constitute a binding legal
              agreement, a guaranteed contract, or a finalized bid for services.
            </p>
            <p>
              <strong>1.2 Initiation of Negotiation:</strong> This form serves strictly as an invitation
              to negotiate. It is a preliminary request designed to begin a discussion regarding potential
              home repair or maintenance services.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">2. Review and Response Process</h3>
            <p className="mb-2">
              <strong>2.1 Right to Reject:</strong> Nailed It Property Solutions reserves the absolute
              right to reject any submitted price, project, or request at its sole discretion, without
              providing a reason or justification.
            </p>
            <p className="mb-2">
              <strong>2.2 Counter-Offers:</strong> The Company may, at its discretion, respond to your
              submission with a counter-offer. A counter-offer is a new proposal and does not bind either
              party until explicitly accepted in writing by both the Customer and the Company.
            </p>
            <p>
              <strong>2.3 No Guarantee of Service:</strong> Submitting a request does not guarantee that
              the Company has the scheduling availability, resources, or intent to complete the requested work.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">3. Accuracy of Information and Scope of Work</h3>
            <p className="mb-2">
              <strong>3.1 Customer Responsibility:</strong> The Customer agrees to provide accurate,
              truthful, and complete information regarding the scope of work, property conditions, and
              any potential hazards.
            </p>
            <p className="mb-2">
              <strong>3.2 On-Site Verification:</strong> Any accepted bid, counter-offer, or preliminary
              agreement is entirely contingent upon an on-site physical inspection by a representative of
              Nailed It Property Solutions.
            </p>
            <p>
              <strong>3.3 Price Adjustments:</strong> If the actual scope of work, material requirements,
              or property conditions differ materially from the Customer&rsquo;s submitted description or
              uploaded media, the Company reserves the right to immediately withdraw any accepted bid or
              counter-offer and issue a revised estimate.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">4. Subscription Tier Pricing (If Applicable)</h3>
            <p>
              If the Customer is an active subscriber to a Nailed It Property Solutions maintenance plan,
              any priority routing or exclusive discounts applied to the &ldquo;Name Your Price&rdquo; tool
              are contingent upon the Customer&rsquo;s account being in good standing at the time of both
              the submission and the completion of the work.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">5. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Nailed It Property Solutions shall not be held liable
              for any direct, indirect, incidental, or consequential damages arising from the use of this
              submission form, the rejection of a proposed bid, delays in communication, or the inability
              to reach a final agreement for services.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">6. Governing Law</h3>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the State of
              Georgia. Any disputes arising from this preliminary submission process shall be subject to
              the exclusive jurisdiction of the courts located in Georgia.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-brand-orange mt-8 mb-2">7. Acknowledgment</h3>
            <p>
              By submitting this form, you acknowledge that you have read, understood, and agree to be
              bound by these Terms of Submission. You further acknowledge that no work will commence, and
              no final agreement is formed, until a formal, separate written contract or final quote is
              approved by both parties.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Terms;
