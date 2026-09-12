import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'What We Do', path: '/what-we-do' },
    { name: 'Contact', path: '/contact' },
    { name: 'Login', path: '/login' },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-2xl flex flex-col">
      {/* Top Gold Bar */}
      <div className="gold-gradient w-full py-1.5 px-4 text-center text-[#0A0A0A] font-body text-xs font-bold tracking-widest uppercase shadow-md z-20">
        <span className="inline-flex items-center gap-2">
          📞 Phone: (706) 237-8184
        </span>
        <span className="hidden md:inline mx-4">|</span>
        <span className="hidden md:inline-flex items-center gap-2">
          📍 Serving Rome & Floyd County, GA
        </span>
      </div>

      {/* Main Header */}
      <div className="bg-[#111111] border-b border-white/5 relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-3 group">
                <img src={logo} alt="Nailed It Property Solutions" className="h-14 w-auto group-hover:scale-105 transition-transform" />
                <div className="hidden sm:flex flex-col">
                  <span className="text-white font-heading text-xl tracking-widest leading-none mb-1">NAILED IT</span>
                  <span className="text-[#a0a0a0] font-body text-[10px] tracking-[0.2em] uppercase leading-none">Property Solutions</span>
                </div>
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden lg:flex space-x-8 xl:space-x-12">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-white hover:text-brand-gold font-body font-bold tracking-widest transition-colors uppercase text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center">
               <Link to="/contact" className="gold-gradient text-[#0A0A0A] px-6 py-2.5 font-body font-bold tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity shadow-lg">
                 REQUEST QUOTE
               </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={toggleMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-brand-gold hover:text-white hover:bg-white/10 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${menuOpen ? 'block' : 'hidden'} lg:hidden bg-[#111111] border-b border-white/10`}>
          <div className="px-4 pt-2 pb-6 space-y-2 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMenu}
                className="block px-3 py-3 rounded-md text-sm font-body font-bold tracking-widest text-white hover:text-brand-gold transition-colors uppercase"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 px-4">
               <Link to="/contact" onClick={closeMenu} className="block gold-gradient text-[#0A0A0A] w-full px-6 py-3 font-body font-bold tracking-widest text-sm rounded-sm shadow-lg">
                 REQUEST QUOTE
               </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
