import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Homeowners from './pages/Homeowners';
import Landlords from './pages/Landlords';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="homeowners" element={<Homeowners />} />
          <Route path="landlords" element={<Landlords />} />
          <Route path="services" element={<Services />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="contact" element={<Contact />} />
          <Route path="careers" element={<Careers />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="terms" element={<Terms />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
