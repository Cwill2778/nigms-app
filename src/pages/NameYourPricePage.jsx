import usePageMeta from '../hooks/usePageMeta';
import NameYourPrice from '../components/NameYourPrice';

function NameYourPricePage() {
  usePageMeta(
    'Name Your Price | Nailed It Property Solutions Rome, GA',
    'Submit your home repair or property maintenance project and name your price. Honest craftsman solutions with transparent pricing in Rome & Floyd County.'
  );

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/30">
          Public Bidding &amp; Estimator
        </span>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-wider text-white mt-4 mb-3">
          Name Your Price Tool
        </h1>
        <p className="text-[#a0a0a0] max-w-xl mx-auto text-sm">
          No pushy sales calls, no surprise fees. Tell us what you need fixed and what fits your budget. We will review and respond with an honest confirmation or counter-offer.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <NameYourPrice />
      </div>
    </div>
  );
}

export default NameYourPricePage;
