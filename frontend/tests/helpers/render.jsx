import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import ToastProvider from '../../src/context/ToastProvider.jsx';

// Exposes the current URL so tests can assert on navigation and query params
const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

// Renders `ui` inside a router (at `route`, matched against `path`) and the toast provider
export const renderWithProviders = (ui, { route = '/', path = '*', extraRoutes = null } = {}) => {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <Routes>
          <Route path={path} element={ui} />
          {extraRoutes}
        </Routes>
        <LocationProbe />
      </ToastProvider>
    </MemoryRouter>,
  );
  return { user, ...result };
};

export const currentLocation = () => document.querySelector('[data-testid="location"]').textContent;
