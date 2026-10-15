import { useState } from 'react';

import categoryApi from '../api/category.api.js';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import CategoryForm from '../components/category/CategoryForm.jsx';
import CategoryTable from '../components/category/CategoryTable.jsx';

// Categories carry descriptions and product counts; the stock summary adds unit and value totals
const fetchCategoriesWithStock = async (options) => {
  const [categories, summary] = await Promise.all([categoryApi.getAll(options), categoryApi.getStockSummary(options)]);
  const stockById = new Map(summary.categories.map((entry) => [entry.categoryId, entry]));
  return categories.map((category) => ({
    ...category,
    totalQuantity: stockById.get(category.id)?.totalQuantity ?? 0,
    totalValue: stockById.get(category.id)?.totalValue ?? 0,
  }));
};

const NEW_CATEGORY = {};

const CategoriesPage = () => {
  const { showToast } = useToast();
  const { data: categories, error, isLoading, refetch } = useFetch(fetchCategoriesWithStock);
  // null: closed, NEW_CATEGORY: creating, a category: editing it
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreating = editing === NEW_CATEGORY;

  const handleSubmit = async (values) => {
    const saved = isCreating ? await categoryApi.create(values) : await categoryApi.update(editing.id, values);
    showToast({ message: `Category "${saved.name}" was ${isCreating ? 'created' : 'updated'}.` });
    setEditing(null);
    refetch();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await categoryApi.remove(deleting.id);
      showToast({ message: `Category "${deleting.name}" was deleted.` });
      refetch();
    } catch (deleteError) {
      showToast({ type: 'error', message: deleteError.message });
    } finally {
      setIsDeleting(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organize products into groups like Beverages, Snacks or Household"
        actions={
          <button type="button" className="button button--primary" onClick={() => setEditing(NEW_CATEGORY)}>
            + Add category
          </button>
        }
      />

      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {isLoading && !categories && <Loader />}
      {categories &&
        (categories.length ? (
          <CategoryTable categories={categories} onEdit={setEditing} onDelete={setDeleting} />
        ) : (
          <EmptyState title="No categories yet">
            <button type="button" className="button" onClick={() => setEditing(NEW_CATEGORY)}>
              Create your first category
            </button>
          </EmptyState>
        ))}

      <Modal
        isOpen={Boolean(editing)}
        title={isCreating ? 'Add category' : `Edit category: ${editing?.name ?? ''}`}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <CategoryForm
            category={isCreating ? null : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete category?"
        message={`Category "${deleting?.name}" will be permanently deleted.`}
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

export default CategoriesPage;
