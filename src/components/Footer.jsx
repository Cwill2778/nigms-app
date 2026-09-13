import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] border-t border-brand-gold pt-12 pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 lg:gap-8 mb-12">
          
          {/* Column 1: Logo Seal */}
          <div className="flex justify-center lg:justify-start w-full lg:w-1/4">
             <Link to="/" className="inline-block">
               <div className="w-24 h-24 rounded-full border-2 border-brand-gold p-1 flex items-center justify-center">
                 <img src={logo} alt="Nailed It Seal" className="w-full h-full object-contain" />
               </div>
            </Link>
          </div>

          {/* Column 2: Contact Info */}
          <div className="w-full lg:w-1/4 text-center lg:text-left">
            <h4 className="text-white font-heading font-bold text-lg mb-1">Charles Willis</h4>
            <p className="text-brand-gold font-body text-[10px] tracking-widest uppercase mb-4">Owner & Field Operations</p>
            <ul className="space-y-2 text-[#a0a0a0] font-body text-xs">
              <li className="flex items-center justify-center lg:justify-start gap-2">
                <span className="text-brand-gold">📞</span> (706) 237-8184
              </li>
              <li className="flex items-center justify-center lg:justify-start gap-2">
                <span className="text-brand-gold">✉️</span> charles@naileditpropertysolutions.com
              </li>
              <li className="flex items-center justify-center lg:justify-start gap-2">
                <span className="text-brand-gold">📍</span> Serving Rome & Floyd County, Georgia
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="w-full lg:w-1/4 text-center lg:text-left flex flex-col items-center lg:items-start">
            <h4 className="text-white font-heading font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-[#a0a0a0] hover:text-brand-gold font-body text-xs uppercase tracking-wider transition-colors">Home</Link></li>
              <li><Link to="/services" className="text-[#a0a0a0] hover:text-brand-gold font-body text-xs uppercase tracking-wider transition-colors">Services</Link></li>
              <li><Link to="/what-we-do" className="text-[#a0a0a0] hover:text-brand-gold font-body text-xs uppercase tracking-wider transition-colors">What We Do</Link></li>
              <li><Link to="/careers" className="text-[#a0a0a0] hover:text-brand-gold font-body text-xs uppercase tracking-wider transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-[#a0a0a0] hover:text-brand-gold font-body text-xs uppercase tracking-wider transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div className="w-full lg:w-1/4 text-center lg:text-left flex flex-col items-center lg:items-start">
            <h4 className="text-white font-heading font-bold text-lg mb-4">Social</h4>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-brand-gold flex items-center justify-center text-brand-gold hover:bg-brand-gold hover:text-black transition-colors">
                <span className="sr-only">Facebook</span>
                f
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-brand-gold flex items-center justify-center text-brand-gold hover:bg-brand-gold hover:text-black transition-colors">
                <span className="sr-only">Instagram</span>
                ig
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-[10px] text-[#666666] font-body tracking-wider uppercase">
            &copy; {currentYear} Nailed It Property Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
