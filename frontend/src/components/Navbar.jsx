import { NavLink } from 'react-router';

import config from '../config/index.js';
import { ROUTES } from '../constants/routes.js';

const Navbar = () => (
  <header className="navbar">
    <span className="navbar__brand">{config.appName}</span>
    <nav className="navbar__links">
      <NavLink to={ROUTES.HOME} end>
        Dashboard
      </NavLink>
      <NavLink to={ROUTES.ITEMS}>Items</NavLink>
    </nav>
  </header>
);

export default Navbar;
