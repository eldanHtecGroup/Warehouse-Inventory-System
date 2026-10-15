export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_NEW: '/products/new',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_EDIT: '/products/:id/edit',
  CATEGORIES: '/categories',
  HISTORY: '/history',
};

export const productDetailPath = (id) => `/products/${id}`;

export const productEditPath = (id) => `/products/${id}/edit`;

export const productsByCategoryPath = (categoryId) => `${ROUTES.PRODUCTS}?categoryId=${categoryId}`;

export const productHistoryPath = (productId) => `${ROUTES.HISTORY}?productId=${productId}`;
