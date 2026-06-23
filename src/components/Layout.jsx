import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NailProgress from './NailProgress';
import ChatBubble from './ChatBubble';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageTracker from '../hooks/usePageTracker';
import './Layout.css';

function Layout() {
  useScrollToTop();
  usePageTracker();

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
