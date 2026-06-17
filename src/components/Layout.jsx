import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NailProgress from './NailProgress';
import useScrollToTop from '../hooks/useScrollToTop';
import './Layout.css';

function Layout() {
  useScrollToTop();

  return (
    <div className="layout">
      <Header />
      <NailProgress />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
