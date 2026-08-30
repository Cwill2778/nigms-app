import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

function NotFound() {
  usePageMeta('404 Not Found | Nailed It Property Solutions', 'The page you are looking for does not exist.');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 page-fade-in">
      <h1 className="text-8xl md:text-9xl text-brand-orange font-heading font-bold mb-4 drop-shadow-[0_0_15px_rgba(255,95,31,0.3)]">404</h1>
      <h2 className="text-2xl md:text-3xl text-text-main font-heading uppercase tracking-wider mb-4">Oops! We couldn't find that page.</h2>
      <p className="text-text-sub max-w-md mx-auto mb-8 text-lg">It looks like the link is broken or the page has moved.</p>
      <Link to="/" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors shadow-[0_0_15px_rgba(255,95,31,0.3)]">Return Home</Link>
    </div>
  );
}

export default NotFound;
