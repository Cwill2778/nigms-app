import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NailProgress from './NailProgress';
import ChatBubble from './ChatBubble';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageTracker from '../hooks/usePageTracker';
import useScrollDepthTracker from '../hooks/useScrollDepthTracker';
import useClickTracker from '../hooks/useClickTracker';
import useExitTracker from '../hooks/useExitTracker';
import useFormAbandonTracker from '../hooks/useFormAbandonTracker';
import useDwellTimeTracker from '../hooks/useDwellTimeTracker';
import useLeadAttribution from '../hooks/useLeadAttribution';
import './Layout.css';

function Layout() {
  useScrollToTop();
  usePageTracker();
  useScrollDepthTracker();
  useClickTracker();
  useExitTracker();
  useFormAbandonTracker();
  useDwellTimeTracker();
  useLeadAttribution();

  return (
    <div className="layout">
      <Header />
      <NailProgress />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatBubble />
    </div>
  );
}

export default Layout;
