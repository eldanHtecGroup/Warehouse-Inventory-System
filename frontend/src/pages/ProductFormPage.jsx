import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import productApi from '../api/product.api.js';
import { ROUTES, productDetailPath } from '../constants/routes.js';
import useCategories from '../hooks/useCategories.js';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import ProductForm from '../components/product/ProductForm.jsx';

// Handles both /products/new and /products/:id/edit
const ProductFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const categories = useCategories();

  const fetchProduct = useCallback((options) => (id ? productApi.getById(id, options) : Promise.resolve(null)), [id]);
  const product = useFetch(fetchProduct);

  const handleSubmit = async (payload) => {
    const saved = isEdit ? await productApi.update(id, payload) : await productApi.create(payload);
    showToast({ message: `"${saved.name}" was ${isEdit ? 'updated' : 'created'}.` });
    navigate(productDetailPath(saved.id));
  };

  const handleCancel = () => navigate(isEdit ? productDetailPath(id) : ROUTES.PRODUCTS);

  const error = product.error || categories.error;
  const isLoading = product.isLoading || categories.isLoading;

  return (
    <>
      <p className="breadcrumb">
        <Link to={isEdit ? productDetailPath(id) : ROUTES.PRODUCTS}>← {isEdit ? 'Back to product' : 'Products'}</Link>
      </p>
      <PageHeader title={isEdit ? 'Edit product' : 'Add product'} />

      {error && <ErrorMessage error={error} onRetry={product.error ? product.refetch : categories.refetch} />}
      {!error && isLoading && <Loader />}
      {!error && !isLoading && (
        <ProductForm
          key={product.data?.id ?? 'new'}
          product={product.data}
          categories={categories.categories}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default ProductFormPage;
