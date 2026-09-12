import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import aptKitchen from '../assets/clocktowerKitchenAptAfter.jpg';

function LandlordSolutions() {
  useScrollToTop();
  usePageMeta(
    'Property Maintenance for Rome Landlords & Investors',
    'Streamline your rental portfolio with flat-rate maintenance subscriptions designed specifically for local landlords and property investors in Rome, GA.'
  );

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen pb-24">
      <section 
        className="relative px-4 py-32 md:py-48 text-center bg-cover bg-center bg-no-repeat mb-16 border-b-2 border-brand-gold shadow-[0_4px_20px_rgba(255,95,31,0.2)]"
        style={{ backgroundImage: `url(${aptKitchen})` }}
      >
        <div className="absolute inset-0 bg-[#0A0A0A]/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-heading font-bold uppercase tracking-wider mb-6 drop-shadow-lg">
            Portfolio Management Without the Headache
          </h1>
          <div className="h-1 w-24 bg-brand-gold text-[#0A0A0A] mx-auto"></div>
        </div>
      </section>
      
      <section className="max-w-4xl mx-auto px-4">
        
        <div className="bg-[#111111] border border-white/10 p-8 md:p-12 rounded-xl shadow-2xl text-left mb-16">
          <p className="text-xl text-[#a0a0a0] leading-relaxed mb-6">
            Being a landlord is demanding enough without having to play general contractor every time a tenant calls with an issue. Our dedicated landlord solutions are designed to take the day-to-day maintenance entirely off your plate.
          </p>
          <p className="text-xl text-[#a0a0a0] leading-relaxed mb-10 border-l-4 border-brand-gold pl-6 italic">
            Instead of fielding midnight calls and hunting down reliable sub-contractors, you get a single point of contact and predictable overhead.
          </p>
          
          <h2 className="text-3xl text-white font-heading font-bold uppercase tracking-wider mb-8 border-b border-white/10 pb-4">The Nailed It Advantage</h2>
          
          <ul className="space-y-6 mb-12">
            <li className="flex items-start">
              <span className="text-brand-gold text-2xl mr-4">✓</span>
              <div>
                <strong className="text-white block text-lg font-heading tracking-wide">Direct Tenant Communication</strong>
                <span className="text-[#a0a0a0]">We handle the scheduling directly with your tenants, removing you from the middleman position.</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-brand-gold text-2xl mr-4">✓</span>
              <div>
                <strong className="text-white block text-lg font-heading tracking-wide">Standardized Unit Upkeep</strong>
                <span className="text-[#a0a0a0]">Consistent preventative maintenance across your entire portfolio prevents small issues from becoming capital expenditures.</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-brand-gold text-2xl mr-4">✓</span>
              <div>
                <strong className="text-white block text-lg font-heading tracking-wide">Rapid Turnovers</strong>
                <span className="text-[#a0a0a0]">When a tenant moves out, we prioritize getting the unit rent-ready faster, minimizing your vacancy losses.</span>
              </div>
            </li>
          </ul>

          <div className="text-center">
            <Link to="/contact" className="bg-brand-gold text-[#0A0A0A] hover:opacity-90 text-wood-900 font-heading font-bold uppercase tracking-wider px-10 py-5 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_25px_rgba(255,95,31,0.5)] hover:-translate-y-1 inline-block">
              Discuss Your Portfolio
            </Link>
          </div>
        </div>

        {/* ROI / Cost of Vacancy Section */}
        <h2 className="text-3xl md:text-4xl text-white font-heading font-bold uppercase tracking-wider mb-6 text-center">
          The True Cost of Deferred Maintenance
        </h2>
        <div className="h-1 w-16 bg-brand-gold text-[#0A0A0A] mx-auto mb-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
          <div className="bg-[#111111]/80 border border-white/10 p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl text-brand-gold font-heading font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Vacancy Loss</h3>
            <p className="text-[#a0a0a0] leading-relaxed mb-4">
              Every week a unit sits empty waiting for a slow contractor to finish a turnover costs you hundreds of dollars in lost rent. Our priority turnover service pays for itself by getting tenants in faster.
            </p>
          </div>
          <div className="bg-[#111111]/80 border border-white/10 p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl text-brand-gold font-heading font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">CapEx Shocks</h3>
            <p className="text-[#a0a0a0] leading-relaxed mb-4">
              A $15 slow drip under a sink turns into a $3,000 subfloor replacement if ignored. Our recurring subscription models put eyes on your properties regularly to catch these issues early.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandlordSolutions;
