import { Outlet } from 'react-router';
import Navbar from '../components/Navbar.jsx';

const MainLayout = () => (
  <div className="layout">
    <Navbar />
    <main className="layout__content">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;
