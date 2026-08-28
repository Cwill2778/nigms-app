import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatBubble from './ChatBubble';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageTracker from '../hooks/usePageTracker';
import useScrollDepthTracker from '../hooks/useScrollDepthTracker';
import useClickTracker from '../hooks/useClickTracker';
import useExitTracker from '../hooks/useExitTracker';
import useFormAbandonTracker from '../hooks/useFormAbandonTracker';
import useDwellTimeTracker from '../hooks/useDwellTimeTracker';
import useLeadAttribution from '../hooks/useLeadAttribution';
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
    <div className="min-h-screen flex flex-col w-full relative">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-fade-in">
        <Outlet />
      </main>
      <Footer />
      <ChatBubble />
    </div>
  );
}

export default Layout;
