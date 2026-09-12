import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import working1 from '../assets/CharlesWorking1.jpg';
import working2 from '../assets/CharlesWorking2.jpg';
import working3 from '../assets/charlesAtWorkIII.jpg';

function AboutUs() {
  useScrollToTop();
  usePageMeta(
    'About Nailed It Property Solutions | Local Rome Handyman',
    'Discover why Rome, GA trusts us for transparent, dependable home repairs and maintenance.'
  );

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen pb-24">
      <section className="max-w-6xl mx-auto px-4 py-24">
        
        {/* Action Gallery */}
        <div className="bg-[#111111] border border-white/10 py-16 px-4 rounded-xl shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl text-white font-heading font-bold uppercase tracking-wider mb-6 text-center">
              Our Work Speaks For Itself
            </h1>
            <div className="h-1 w-24 bg-brand-gold text-[#0A0A0A] mx-auto mb-12"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-xl group">
                <img src={working1} alt="Charles working on site" className="w-full h-64 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="bg-[#111111] p-4 border-t border-brand-gold/30">
                  <p className="text-white font-heading font-bold uppercase tracking-wider text-sm">Heavy Machinery & Groundwork</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-xl group md:-translate-y-6">
                <img src={working2} alt="Charles executing precision woodwork" className="w-full h-64 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="bg-[#111111] p-4 border-t border-brand-gold/30">
                  <p className="text-white font-heading font-bold uppercase tracking-wider text-sm">Precision Carpentry</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-xl group">
                <img src={working3} alt="Charles reviewing plans" className="w-full h-64 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="bg-[#111111] p-4 border-t border-brand-gold/30">
                  <p className="text-white font-heading font-bold uppercase tracking-wider text-sm">Structural Diagnostics</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/contact" className="text-brand-gold hover:text-white font-bold uppercase tracking-widest border-b-2 border-transparent hover:border-brand-gold transition-colors inline-block text-lg">
                Start Your Project &rarr;
              </Link>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}

export default AboutUs;
