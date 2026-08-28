import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import './NotFound.css';

function NotFound() {
  usePageMeta('404 Not Found | Nailed It Property Solutions', 'The page you are looking for does not exist.');

  return (
    <div className="not-found-page">
      <h1>404</h1>
      <h2>Oops! We couldn't find that page.</h2>
      <p>It looks like the link is broken or the page has moved.</p>
      <Link to="/" className="cta-button">Return Home</Link>
    </div>
  );
}

export default NotFound;
