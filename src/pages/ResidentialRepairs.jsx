import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import kitchenBefore from '../assets/kitchenBefore_new.jpg';
import kitchenAfter from '../assets/kitchenAfter_new.jpg';
import exteriorBefore from '../assets/exteriorHouseRoofSidingBefore.jpg';
import exteriorAfter from '../assets/exteriorAfter.jpg';
import miniBar from '../assets/miniBar.jpg';

function ResidentialRepairs() {
  useScrollToTop();
  usePageMeta(
    'Expert Residential Home Repairs in Rome, GA | Nailed It Property Solutions',
    'From drywall patching to deck repairs, get reliable, flat-rate residential repair services in Rome, GA. We fix it right the first time.'
  );

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          Complete Residential Repairs for Rome Homeowners
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
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
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl md:text-5xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 text-center">
          See the Difference
        </h2>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-12"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Project 1 */}
          <div className="bg-wood-800 border border-border-subtle rounded-xl overflow-hidden shadow-2xl group">
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img src={kitchenBefore} alt="Kitchen before repair" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 bg-wood-900/80 text-text-main px-4 py-1 rounded font-bold uppercase tracking-wider text-sm backdrop-blur-sm border border-border-subtle">Before</div>
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden border-t-4 border-brand-orange">
              <img src={kitchenAfter} alt="Kitchen after repair" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 bg-brand-orange text-wood-900 px-4 py-1 rounded font-bold uppercase tracking-wider text-sm shadow-md">After</div>
            </div>
            <div className="p-6">
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Kitchen Renovation</h3>
              <p className="text-text-sub">Complete tear-out and refinishing to bring the heart of the home back to life.</p>
            </div>
          </div>

          {/* Project 2 */}
          <div className="bg-wood-800 border border-border-subtle rounded-xl overflow-hidden shadow-2xl group">
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img src={exteriorBefore} alt="Exterior Siding before repair" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 bg-wood-900/80 text-text-main px-4 py-1 rounded font-bold uppercase tracking-wider text-sm backdrop-blur-sm border border-border-subtle">Before</div>
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden border-t-4 border-brand-orange">
              <img src={exteriorAfter} alt="Exterior Siding after repair" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 bg-brand-orange text-wood-900 px-4 py-1 rounded font-bold uppercase tracking-wider text-sm shadow-md">After</div>
            </div>
            <div className="p-6">
              <h3 className="text-xl text-text-main font-heading font-bold uppercase tracking-wider mb-2">Exterior Siding & Repair</h3>
              <p className="text-text-sub">Restoring the exterior envelope of the home, protecting it from the elements and boosting curb appeal.</p>
            </div>
          </div>
        </div>

        {/* Highlight Project */}
        <div className="bg-wood-card border-2 border-brand-orange rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,95,31,0.15)] flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <img src={miniBar} alt="Custom mini bar installation" className="w-full h-full object-cover" />
          </div>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="inline-block bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-4 py-1 rounded-full font-bold uppercase tracking-wider text-sm mb-4 w-max">Custom Carpentry</div>
            <h3 className="text-2xl md:text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-4">Custom Mini-Bar Build</h3>
            <p className="text-lg text-text-sub leading-relaxed mb-8">
              Sometimes you need more than just a repair—you need an upgrade. From custom shelving and built-ins to specialized woodworking, we can bring your vision to life with craftsman precision.
            </p>
            <Link to="/contact" className="text-brand-orange hover:text-brand-hover font-bold uppercase tracking-widest border-b border-transparent hover:border-brand-orange transition-colors inline-block w-max">
              Discuss Your Project &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ResidentialRepairs;
