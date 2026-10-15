import { Link, NavLink } from 'react-router';

import config from '../config/index.js';
import { ROUTES } from '../constants/routes.js';

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: 'Dashboard', end: true },
  { to: ROUTES.PRODUCTS, label: 'Products' },
  { to: ROUTES.CATEGORIES, label: 'Categories' },
  { to: ROUTES.HISTORY, label: 'History' },
];

const Navbar = () => (
  <header className="navbar">
    <Link to={ROUTES.HOME} className="navbar__brand">
      <img src="/favicon.svg" alt="" width="24" height="24" />
      {config.appName}
    </Link>
    <nav className="navbar__links" aria-label="Main">
      {NAV_ITEMS.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end}>
          {label}
        </NavLink>
      ))}
    </nav>
  </header>
);

export default Navbar;
