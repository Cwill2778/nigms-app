import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import miniBar from '../assets/miniBar.jpg';
import deckStain from '../assets/deckStainBeforeAndAfter.webp';
import deckRebuild from '../assets/deckBeforeAndAfter.webp';
import miniBarBA from '../assets/miniBarBeforeAndAfter.PNG';
import outdoorSitting from '../assets/outdoorSittingArea.jpg';
import fanInstall from '../assets/exteriorFanInstallation.jpg';

function ResidentialRepairs() {
  useScrollToTop();
  usePageMeta(
    'Expert Residential Home Repairs in Rome, GA | Nailed It Property Solutions',
    'From drywall patching to deck repairs, get reliable, flat-rate residential repair services in Rome, GA. We fix it right the first time.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      {/* Hero Section */}
      <section 
        className="relative px-4 py-32 md:py-48 text-center bg-cover bg-center bg-no-repeat mb-16"
        style={{ backgroundImage: `url(${miniBar})` }}
      >
        <div className="absolute inset-0 bg-wood-900/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 drop-shadow-lg">
            Complete Residential Repairs for Rome Homeowners
          </h1>
          <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl text-left">
          <p className="text-xl text-text-sub leading-relaxed mb-6">
            Your home is your biggest investment, and keeping it in top shape shouldn't be a source of stress. Whether you are dealing with a hole in the drywall, a sticking door, or a deck that has seen better days, our team delivers high-quality, dependable repairs.
          </p>
          <p className="text-xl text-text-sub leading-relaxed mb-10 border-l-4 border-brand-orange pl-6 italic">
            We utilize a transparent, flat-rate pricing model, meaning you know exactly what a repair will cost without the anxiety of a ticking hourly clock.
          </p>
          
          <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 border-b border-border-subtle pb-4">What We Fix:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex items-start bg-wood-800 p-6 rounded-lg border border-border-subtle hover:border-brand-orange/50 transition-colors">
              <span className="text-brand-orange text-3xl mr-4">🔨</span>
              <div>
                <strong className="text-text-main text-xl block mb-2 uppercase font-heading tracking-wide">Carpentry & Woodwork</strong>
                <span className="text-text-sub">Deck repairs, porch restoration, and custom trim.</span>
              </div>
            </div>
            <div className="flex items-start bg-wood-800 p-6 rounded-lg border border-border-subtle hover:border-brand-orange/50 transition-colors">
              <span className="text-brand-orange text-3xl mr-4">🖌️</span>
              <div>
                <strong className="text-text-main text-xl block mb-2 uppercase font-heading tracking-wide">Drywall & Paint</strong>
                <span className="text-text-sub">Patching holes, fixing water damage, and seamless touch-ups.</span>
              </div>
            </div>
            <div className="flex items-start bg-wood-800 p-6 rounded-lg border border-border-subtle hover:border-brand-orange/50 transition-colors">
              <span className="text-brand-orange text-3xl mr-4">🚪</span>
              <div>
                <strong className="text-text-main text-xl block mb-2 uppercase font-heading tracking-wide">Doors & Windows</strong>
                <span className="text-text-sub">Realigning doors, fixing locks, and replacing worn weatherstripping.</span>
              </div>
            </div>
            <div className="flex items-start bg-wood-800 p-6 rounded-lg border border-border-subtle hover:border-brand-orange/50 transition-colors">
              <span className="text-brand-orange text-3xl mr-4">🔧</span>
              <div>
                <strong className="text-text-main text-xl block mb-2 uppercase font-heading tracking-wide">General Handyman Services</strong>
                <span className="text-text-sub">Fixture installation, TV mounting, and furniture assembly.</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/contact" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-10 py-5 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_25px_rgba(255,95,31,0.5)] hover:-translate-y-1 inline-block">
              Request a Repair Estimate
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 text-center">
          Our Recent Projects
        </h2>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-16"></div>
        
        {/* Before and After Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-wood-800 border border-border-subtle rounded-xl overflow-hidden shadow-xl group">
            <div className="relative h-64 overflow-hidden">
              <img src={deckStain} alt="Deck Stain Before and After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Deck Restoration</h3>
              <p className="text-text-sub text-sm">Stripping, sanding, and re-staining to bring weathered wood back to life.</p>
            </div>
          </div>

          <div className="bg-wood-800 border border-border-subtle rounded-xl overflow-hidden shadow-xl group md:-translate-y-4">
            <div className="relative h-64 overflow-hidden">
              <img src={deckRebuild} alt="Deck Rebuild Before and After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Deck Rebuild</h3>
              <p className="text-text-sub text-sm">Full structural tear-down and rebuild for safety and outdoor enjoyment.</p>
            </div>
          </div>

          <div className="bg-wood-800 border border-border-subtle rounded-xl overflow-hidden shadow-xl group">
            <div className="relative h-64 overflow-hidden">
              <img src={miniBarBA} alt="Mini Bar Before and After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Custom Built-Ins</h3>
              <p className="text-text-sub text-sm">Transforming dead space into a functional, beautiful custom mini-bar.</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative rounded-xl overflow-hidden shadow-xl group h-80">
            <img src={outdoorSitting} alt="Outdoor Sitting Area" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-wood-900 via-wood-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="inline-block bg-brand-orange text-wood-900 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">Outdoor Living</span>
              <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">Patio Upgrades</h3>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden shadow-xl group h-80">
            <img src={fanInstall} alt="Exterior Fan Installation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-wood-900 via-wood-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="inline-block bg-brand-orange text-wood-900 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">Fixture Upgrades</span>
              <h3 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider">Exterior Fans & Lighting</h3>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ResidentialRepairs;
