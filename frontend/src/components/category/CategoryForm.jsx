import { useState } from 'react';

import { LIMITS } from '../../constants/inventory.js';
import { getFieldErrors } from '../../utils/apiErrors.js';
import FormField from '../common/FormField.jsx';

const validate = ({ name, description }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  else if (name.trim().length > LIMITS.CATEGORY_NAME) errors.name = `Name must be at most ${LIMITS.CATEGORY_NAME} characters.`;
  if (description.trim().length > LIMITS.CATEGORY_DESCRIPTION) {
    errors.description = `Description must be at most ${LIMITS.CATEGORY_DESCRIPTION} characters.`;
  }
  return errors;
};

const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [values, setValues] = useState({ name: category?.name ?? '', description: category?.description ?? '' });
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

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: values.name.trim(), description: values.description.trim() || null });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setFormError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="error-message" role="alert">
          {formError}
        </p>
      )}
      <FormField label="Name" error={errors.name} hint="e.g. Beverages, Snacks, Household">
        <input name="name" value={values.name} onChange={handleChange} maxLength={LIMITS.CATEGORY_NAME} required />
      </FormField>
      <FormField label="Description (optional)" error={errors.description}>
        <textarea
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
          maxLength={LIMITS.CATEGORY_DESCRIPTION}
        />
      </FormField>
      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : category ? 'Save changes' : 'Create category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
