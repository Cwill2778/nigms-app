import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

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
            <li><Link to="/services" onClick={closeMenu}>Services</Link></li>
            <li><Link to="/reviews" onClick={closeMenu}>Reviews</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
            <li><Link to="/dashboard" onClick={closeMenu}>My Account</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
