import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';

const MainLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="layout">
      <Navbar />
      <main className="layout__content">
        {/* Navigating to another page clears a previous page's crash */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default MainLayout;
