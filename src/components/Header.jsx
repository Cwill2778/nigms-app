import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          <img src={logo} alt="Nailed It Property Solutions" width="160" height="48" />
        </Link>
        <button
          className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`header-nav${menuOpen ? ' header-nav--open' : ''}`} aria-label="Main navigation">
          <ul>
            <li><Link to="/" onClick={closeMenu}>Home</Link></li>
            <li className={`has-dropdown${dropdownOpen === 'about' ? ' dropdown-open' : ''}`}>
              <button className="dropdown-trigger" onClick={(e) => { e.preventDefault(); setDropdownOpen(dropdownOpen === 'about' ? false : 'about'); }} aria-expanded={dropdownOpen === 'about'}>
                About <span className="dropdown-arrow">▾</span>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/about" onClick={closeMenu}>About Us</Link></li>
                <li><Link to="/reviews" onClick={closeMenu}>Reviews</Link></li>
                <li><Link to="/faq" onClick={closeMenu}>FAQ</Link></li>
                <li><Link to="/careers" onClick={closeMenu}>Careers</Link></li>
                <li><Link to="/contact" onClick={closeMenu}>Contact Us</Link></li>
              </ul>
            </li>
            <li className={`has-dropdown${dropdownOpen === 'services' ? ' dropdown-open' : ''}`}>
              <button className="dropdown-trigger" onClick={(e) => { e.preventDefault(); setDropdownOpen(dropdownOpen === 'services' ? false : 'services'); }} aria-expanded={dropdownOpen === 'services'}>
                Services <span className="dropdown-arrow">▾</span>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/services" onClick={closeMenu}>All Services</Link></li>
                <li><Link to="/subscriptions" onClick={closeMenu}>Subscription Plans</Link></li>
                <li><Link to="/turnovers" onClick={closeMenu}>Unit Turnovers</Link></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      <div className="social-bar">
        <a href="https://maps.app.goo.gl/J6uxtzZ1p4EFmLnJ8" target="_blank" rel="noopener noreferrer">Google</a>
        <a href="https://nextdoor.com/page/nailed-it-property-solutions-rome-ga/" target="_blank" rel="noopener noreferrer">Nextdoor</a>
        <a href="https://www.yelp.com/biz/nailed-it-property-solutions-rome" target="_blank" rel="noopener noreferrer">Yelp</a>
      </div>
    </header>
  );
}

export default Header;
