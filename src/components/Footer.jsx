import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 border-t-2 border-brand-orange shadow-[0_-4px_15px_rgba(255,95,31,0.3)] pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-1 flex flex-col items-start">
            <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/50 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider mb-4">
              🟢 Open 24/7
            </span>
            <p className="text-text-sub text-sm leading-relaxed mb-4">
              When your home is at stake, we don&rsquo;t believe in business hours only.
            </p>
            <a href="tel:7062378184" className="text-xl font-heading font-bold text-text-main hover:text-brand-orange transition-colors">
              706.237.8184
            </a>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-text-main font-heading font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Services</Link></li>
              <li><Link to="/reviews" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Reviews</Link></li>
              <li><Link to="/faq" className="text-text-sub hover:text-brand-orange text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/careers" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Contact</Link></li>
              <li><Link to="/terms" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Terms</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-text-main font-heading font-bold uppercase tracking-wider mb-4">Find Us On</h4>
            <ul className="space-y-2">
              <li><a href="https://nextdoor.com/page/nailed-it-property-solutions-rome-ga/" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Nextdoor</a></li>
              <li><a href="https://maps.app.goo.gl/J6uxtzZ1p4EFmLnJ8" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Google Business</a></li>
              <li><a href="https://www.yelp.com/biz/nailed-it-property-solutions-rome" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Yelp</a></li>
              <li><a href="https://www.bbb.org" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Better Business Bureau</a></li>
              <li><a href="https://www.linkedin.com/company/nailed-it-property-solutions" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">LinkedIn</a></li>
              <li><a href="https://g.page/r/CWiM9mqvEGVkEBM/review" target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-brand-orange text-sm transition-colors">Leave a Google Review</a></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-text-main font-heading font-bold uppercase tracking-wider mb-4">Service Areas</h4>
            <ul className="space-y-2">
              <li className="text-text-sub text-sm">West Rome</li>
              <li className="text-text-sub text-sm">North Rome</li>
              <li className="text-text-sub text-sm">East Rome</li>
              <li className="text-text-sub text-sm">South Rome</li>
              <li className="text-text-sub text-sm">Downtown Rome</li>
              <li className="text-text-sub text-sm">Clocktower Hill</li>
              <li className="text-text-sub text-sm">Floyd County</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-text-sub">
          <p className="mb-4 md:mb-0">&copy; {currentYear} Nailed It Property Solutions. All rights reserved.</p>
          <p>Developed by <a href="https://www.cronantech.com" target="_blank" rel="noopener noreferrer" className="text-text-main hover:text-brand-orange transition-colors">Cronan Technology</a></p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

