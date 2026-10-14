import { Route, Routes } from 'react-router';

import { ROUTES } from '../constants/routes.js';
import MainLayout from '../layouts/MainLayout.jsx';
import HomePage from '../pages/HomePage.jsx';
import ItemsPage from '../pages/ItemsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const AppRouter = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.ITEMS} element={<ItemsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRouter;
