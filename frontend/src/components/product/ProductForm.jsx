import { useState } from 'react';
import { Link } from 'react-router';

import { LIMITS } from '../../constants/inventory.js';
import { ROUTES } from '../../constants/routes.js';
import { getFieldErrors } from '../../utils/apiErrors.js';
import { formatNumber } from '../../utils/formatters.js';
import FormField from '../common/FormField.jsx';

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const WHOLE_NUMBER_PATTERN = /^\d+$/;

const toFormValues = (product) => ({
  name: product?.name ?? '',
  code: product?.code ?? '',
  description: product?.description ?? '',
  price: product ? String(product.price) : '',
  quantity: '0',
  categoryId: product ? String(product.categoryId) : '',
});

// Mirrors the backend validators so most mistakes are caught before a request is sent
const validate = (values, isEdit) => {
  const errors = {};
  const name = values.name.trim();
  const code = values.code.trim();
  const price = values.price.trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length > LIMITS.PRODUCT_NAME) errors.name = `Name must be at most ${LIMITS.PRODUCT_NAME} characters.`;

  if (!code) errors.code = 'Code is required.';
  else if (code.length > LIMITS.PRODUCT_CODE) errors.code = `Code must be at most ${LIMITS.PRODUCT_CODE} characters.`;

  if (!price) errors.price = 'Price is required.';
  else if (!PRICE_PATTERN.test(price)) errors.price = 'Enter a non-negative price with at most 2 decimal places.';
  else if (Number(price) > LIMITS.MAX_PRICE) errors.price = `Price must be at most ${LIMITS.MAX_PRICE}.`;

  if (!values.categoryId) errors.categoryId = 'Select a category.';

  if (values.description.trim().length > LIMITS.PRODUCT_DESCRIPTION) {
    errors.description = `Description must be at most ${LIMITS.PRODUCT_DESCRIPTION} characters.`;
  }

  if (!isEdit) {
    const quantity = values.quantity.trim();
    if (!WHOLE_NUMBER_PATTERN.test(quantity)) errors.quantity = 'Initial quantity must be a whole number of 0 or more.';
    else if (Number(quantity) > LIMITS.MAX_QUANTITY) {
      errors.quantity = `Initial quantity must be at most ${formatNumber(LIMITS.MAX_QUANTITY)}.`;
    }
  }

  return errors;
};

const toPayload = (values, isEdit) => ({
  name: values.name.trim(),
  code: values.code.trim(),
  description: values.description.trim() || null,
  price: Number(values.price),
  categoryId: Number(values.categoryId),
  // Quantity is only set on creation; later changes go through stock adjustments
  ...(!isEdit && { quantity: Number(values.quantity) }),
});

const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
  const isEdit = Boolean(product);
  const [values, setValues] = useState(() => toFormValues(product));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validate(values, isEdit);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values, isEdit));
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setFormError(error.message);
      setIsSubmitting(false);
    }
  };

  if (!categories.length) {
    return (
      <div className="card">
        <p>
          You need at least one category before adding products.{' '}
          <Link to={ROUTES.CATEGORIES}>Create a category</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="error-message" role="alert">
          {formError}
        </p>
      )}

      <div className="form-grid">
        <FormField label="Name" error={errors.name}>
          <input name="name" value={values.name} onChange={handleChange} maxLength={LIMITS.PRODUCT_NAME} required />
        </FormField>

        <FormField label="Code (SKU)" error={errors.code} hint="Unique product code, e.g. BEV-001">
          <input name="code" value={values.code} onChange={handleChange} maxLength={LIMITS.PRODUCT_CODE} required />
        </FormField>

        <FormField label="Category" error={errors.categoryId}>
          <select name="categoryId" value={values.categoryId} onChange={handleChange} required>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Price" error={errors.price}>
          <input
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            max={LIMITS.MAX_PRICE}
            step="0.01"
            value={values.price}
            onChange={handleChange}
            required
          />
        </FormField>

        {!isEdit && (
          <FormField label="Initial quantity" error={errors.quantity} hint="Recorded as the first entry in the stock history">
            <input
              name="quantity"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.quantity}
              onChange={handleChange}
            />
          </FormField>
        )}
      </div>

      <FormField label="Description (optional)" error={errors.description}>
        <textarea
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange}
          maxLength={LIMITS.PRODUCT_DESCRIPTION}
        />
      </FormField>

      {isEdit && (
        <p className="form-note">
          Stock quantity can't be edited here. Use <strong>Adjust stock</strong> so every change is recorded in the
          history.
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
