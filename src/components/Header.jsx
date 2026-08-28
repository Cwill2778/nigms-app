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
    { name: 'Reviews', path: '/reviews' },
    { name: 'Contact', path: '/contact' },
    { name: 'My Account', path: '/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b-2 border-brand-orange shadow-[0_4px_15px_rgba(255,95,31,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex-shrink-0">
              <img src={logo} alt="Nailed It Property Solutions" className="h-12 w-auto" />
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-text-main hover:text-brand-orange uppercase font-heading font-bold tracking-wide transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
             <a href="tel:7062378184" className="bg-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-wood-900 border border-brand-orange/50 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider transition-colors">
               706.237.8184
             </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-text-sub hover:text-brand-orange hover:bg-wood-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-orange"
            >
              <span className="sr-only">Open main menu</span>
              <svg className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${menuOpen ? 'block' : 'hidden'} md:hidden bg-navy-900 border-b border-border-subtle`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={closeMenu}
              className="block px-3 py-2 rounded-md text-base font-bold font-heading uppercase tracking-wide text-text-main hover:text-brand-orange hover:bg-wood-800 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="px-3 py-2 mt-4">
             <a href="tel:7062378184" className="inline-block bg-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-wood-900 border border-brand-orange/50 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider transition-colors">
               706.237.8184
             </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
