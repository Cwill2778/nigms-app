import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-contact">
          <p><a href="tel:+17068448193">(706) 844-8193</a> &nbsp;|&nbsp; PO Box 53, Rome, GA 30162</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/subscriptions">Plans</Link></li>
              <li><Link to="/turnovers">Turnovers</Link></li>
              <li><Link to="/reviews">Reviews</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Find Us On</h4>
            <ul>
              <li><a href="https://nextdoor.com/pages/nailed-it-property-solutions-rome-ga" target="_blank" rel="noopener noreferrer">Nextdoor</a></li>
              <li><a href="https://share.google/hOg4Vl8iqFu7EWr4c" target="_blank" rel="noopener noreferrer">Google Business</a></li>
              <li><a href="https://g.page/r/CWiM9mqvEGVkEBM/review" target="_blank" rel="noopener noreferrer">Leave a Google Review</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Nailed It Property Solutions. All rights reserved.</p>
          <p>Developed by <a href="https://www.cronantech.com" target="_blank" rel="noopener noreferrer">Cronan Technology</a></p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
