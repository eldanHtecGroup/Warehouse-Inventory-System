import { Route, Routes } from 'react-router';

import { ROUTES } from '../constants/routes.js';
import MainLayout from '../layouts/MainLayout.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import ProductsPage from '../pages/ProductsPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import ProductFormPage from '../pages/ProductFormPage.jsx';
import CategoriesPage from '../pages/CategoriesPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const AppRouter = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path={ROUTES.HOME} element={<DashboardPage />} />
      <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
      <Route path={ROUTES.PRODUCT_NEW} element={<ProductFormPage />} />
      <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
      <Route path={ROUTES.PRODUCT_EDIT} element={<ProductFormPage />} />
      <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
      <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRouter;
