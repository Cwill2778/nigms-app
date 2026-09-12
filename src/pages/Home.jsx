import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import logoSeal from '../assets/logo.png';
import heroImage from '../assets/skyOverRome.jpg';

function Home() {
  useScrollReveal();
  usePageMeta(
    'Premium Property Solutions | Rome & Floyd County, GA',
    'Nailed It Property Solutions keeps homes ready, repairs reliable, and property history protected.'
  );

  return (
    <div className="w-full bg-[#0A0A0A] text-white">
      
      {/* HERO SECTION */}
      <section 
        className="relative min-h-[85vh] flex flex-col items-center justify-center bg-cover bg-center text-center px-4"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center mt-12">
          <h1 className="text-4xl md:text-5xl lg:text-[4rem] text-brand-gold font-heading font-bold uppercase tracking-wide leading-tight mb-6 drop-shadow-2xl">
            PREMIUM PROPERTY SOLUTIONS IN<br/>ROME & FLOYD COUNTY, GEORGIA
          </h1>
          <p className="text-lg md:text-xl text-white font-body font-medium mb-12 tracking-wide drop-shadow-md">
            Keeping homes ready, repairs reliable, and property history protected.
          </p>
          
          {/* Circular Seal */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-brand-gold p-1 bg-black/50 backdrop-blur-sm mb-12 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <img src={logoSeal} alt="Nailed It Seal" className="w-full h-full object-contain drop-shadow-lg" />
          </div>

          <Link to="/contact" className="inline-block gold-gradient text-[#0A0A0A] font-body font-bold tracking-widest text-sm uppercase px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
            REQUEST A FREE QUOTE
          </Link>
        </div>
      </section>

      {/* MAIN BODY SECTION */}
      <section className="relative z-20 py-24 px-4 bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto">
          
          <h2 className="text-center font-body font-bold text-sm uppercase tracking-[0.3em] mb-16 text-white">
            COMPREHENSIVE PROPERTY CARE
          </h2>

          {/* 4 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-24">
            
            <div className="bg-[#111111] rounded-lg p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group border border-white/5 hover:border-brand-gold/30 transition-colors">
              <div className="absolute top-0 left-0 w-32 h-32 bg-brand-gold opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="text-brand-gold text-5xl mb-6">📅</div>
              <h3 className="text-white font-body font-bold text-sm uppercase tracking-widest leading-relaxed">PREVENTATIVE<br/>MAINTENANCE</h3>
              <p className="text-[#a0a0a0] text-xs mt-4">Scheduled inspections and seasonal tasks to catch issues before they become emergencies.</p>
            </div>

            <div className="bg-[#111111] rounded-lg p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group border border-white/5 hover:border-brand-gold/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="text-brand-gold text-5xl mb-6">🛠️</div>
              <h3 className="text-white font-body font-bold text-sm uppercase tracking-widest leading-relaxed">GENERAL<br/>REPAIRS</h3>
              <p className="text-[#a0a0a0] text-xs mt-4">Dependable solutions for plumbing, drywall, fixtures, hardware, and everyday home issues.</p>
            </div>

            <div className="bg-[#111111] rounded-lg p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group border border-white/5 hover:border-brand-gold/30 transition-colors">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="text-brand-gold text-5xl mb-6">🚨</div>
              <h3 className="text-white font-body font-bold text-sm uppercase tracking-widest leading-relaxed">24/7 EMERGENCY<br/>RESPONSE</h3>
              <p className="text-[#a0a0a0] text-xs mt-4">Urgent support for leaks, broken entry points, and hazards to minimize property damage.</p>
            </div>

            <div className="bg-[#111111] rounded-lg p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group border border-white/5 hover:border-brand-gold/30 transition-colors">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-gold opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="text-brand-gold text-5xl mb-6">📋</div>
              <h3 className="text-white font-body font-bold text-sm uppercase tracking-widest leading-relaxed">VERIFIED<br/>SERVICE LOGS</h3>
              <p className="text-[#a0a0a0] text-xs mt-4">Detailed records and condition reports to support sales, refinancing, and insurance.</p>
            </div>

          </div>

          {/* TRUST & PROCESS */}
          <div className="text-center">
            <h2 className="font-heading font-bold text-2xl text-brand-gold mb-12">Trust and Process</h2>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
              
              <div className="flex items-center gap-3">
                <span className="text-brand-gold text-4xl font-light">(</span>
                <span className="text-white font-body font-bold tracking-widest text-sm uppercase">RELIABLE SERVICE</span>
                <span className="text-brand-gold text-4xl font-light">)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-brand-gold text-4xl font-light">(</span>
                <span className="text-white font-body font-bold tracking-widest text-sm uppercase">VERIFIED UPKEEP</span>
                <span className="text-brand-gold text-4xl font-light">)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-brand-gold text-4xl font-light">(</span>
                <span className="text-white font-body font-bold tracking-widest text-sm uppercase">LICENSED & INSURED</span>
                <span className="text-brand-gold text-4xl font-light">)</span>
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;
