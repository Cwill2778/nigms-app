import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/reviews">Reviews</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Find Us On</h4>
            <ul>
              <li><a href="https://nextdoor.com/page/nailed-it-property-solutions-rome-ga/" target="_blank" rel="noopener noreferrer">Nextdoor</a></li>
              <li><a href="https://maps.app.goo.gl/J6uxtzZ1p4EFmLnJ8" target="_blank" rel="noopener noreferrer">Google Business</a></li>
              <li><a href="https://www.yelp.com/biz/nailed-it-property-solutions-rome" target="_blank" rel="noopener noreferrer">Yelp</a></li>
              <li><a href="https://g.page/r/CWiM9mqvEGVkEBM/review" target="_blank" rel="noopener noreferrer">Leave a Google Review</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Service Areas</h4>
            <ul>
              <li>West Rome</li>
              <li>North Rome</li>
              <li>East Rome</li>
              <li>South Rome</li>
              <li>Downtown Rome</li>
              <li>Clocktower Hill</li>
              <li>Floyd County</li>
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
