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
    </header>
  );
}

export default Header;
