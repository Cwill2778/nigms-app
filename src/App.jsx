import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import ResidentialRepairs from './pages/ResidentialRepairs';
import ApplianceRepair from './pages/ApplianceRepair';
import EmergencyMaintenance from './pages/EmergencyMaintenance';
import MaintenancePlans from './pages/MaintenancePlans';
import LandlordSolutions from './pages/LandlordSolutions';
import AboutUs from './pages/AboutUs';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import FAQ from './pages/FAQ';
import Admin from './pages/Admin';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Checkout from './pages/Checkout';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            <Route path="services" element={<Services />} />

            {/* SEO Service Pages */}
            <Route path="services/residential-repairs" element={<ResidentialRepairs />} />
            <Route path="services/appliance-repair" element={<ApplianceRepair />} />
            <Route path="services/emergency-maintenance" element={<EmergencyMaintenance />} />
            
            {/* Core Pages */}
            <Route path="maintenance-plans" element={<MaintenancePlans />} />
            <Route path="landlord-solutions" element={<LandlordSolutions />} />
            <Route path="about-us" element={<AboutUs />} />
            
            {/* Other Existing Pages */}
            <Route path="reviews" element={<Reviews />} />
            <Route path="contact" element={<Contact />} />
            <Route path="careers" element={<Careers />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="terms" element={<Terms />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="admin" element={<Admin />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
