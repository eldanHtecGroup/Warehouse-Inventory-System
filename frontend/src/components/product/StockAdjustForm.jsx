import { useState } from 'react';

import productApi from '../../api/product.api.js';
import { LIMITS, STOCK_ADJUSTMENT } from '../../constants/inventory.js';
import useToast from '../../hooks/useToast.js';
import { formatNumber } from '../../utils/formatters.js';
import FormField from '../common/FormField.jsx';

const WHOLE_NUMBER_PATTERN = /^\d+$/;

// Increase or decrease stock. Decreasing below zero is blocked here and by the backend (422).
const StockAdjustForm = ({ product, onAdjusted }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState(STOCK_ADJUSTMENT.INCREASE);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDecrease = mode === STOCK_ADJUSTMENT.DECREASE;
  const amount = WHOLE_NUMBER_PATTERN.test(quantity.trim()) ? Number(quantity) : NaN;

  let validationError = null;
  if (isDecrease && product.quantity === 0) {
    validationError = 'This product is out of stock, so its quantity cannot be decreased.';
  } else if (!(amount >= 1)) {
    validationError = 'Enter a whole number greater than 0.';
  } else if (isDecrease && amount > product.quantity) {
    validationError = `Only ${formatNumber(product.quantity)} in stock. Stock can't go below zero.`;
  } else if (!isDecrease && product.quantity + amount > LIMITS.MAX_QUANTITY) {
    validationError = `Stock can't exceed ${formatNumber(LIMITS.MAX_QUANTITY)} (currently ${formatNumber(product.quantity)}).`;
  }

  const newQuantity = validationError ? null : product.quantity + (isDecrease ? -amount : amount);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setSubmitError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validationError) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const adjust = isDecrease ? productApi.decreaseStock : productApi.increaseStock;
      const result = await adjust(product.id, { quantity: amount, reason: reason.trim() || undefined });
      showToast({
        message: `${product.name}: stock ${isDecrease ? 'decreased' : 'increased'} by ${formatNumber(amount)} (now ${formatNumber(result.product.quantity)}).`,
      });
      setQuantity('1');
      setReason('');
      onAdjusted?.(result);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form stock-form" onSubmit={handleSubmit} noValidate>
      <div className="segmented" role="group" aria-label="Adjustment type">
        <button
          type="button"
          className="segmented__option"
          aria-pressed={!isDecrease}
          onClick={() => handleModeChange(STOCK_ADJUSTMENT.INCREASE)}
        >
          + Increase
        </button>
        <button
          type="button"
          className="segmented__option"
          aria-pressed={isDecrease}
          onClick={() => handleModeChange(STOCK_ADJUSTMENT.DECREASE)}
        >
          − Decrease
        </button>
      </div>

      <FormField label="Quantity" error={quantity !== '' ? validationError : null}>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max={isDecrease ? product.quantity : LIMITS.MAX_QUANTITY - product.quantity}
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
      </FormField>

      <FormField label="Reason (optional)" hint="e.g. Supplier delivery, Sale, Damaged goods">
        <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={LIMITS.REASON} />
      </FormField>

      <p className="stock-form__preview">
        Current: <strong>{formatNumber(product.quantity)}</strong>
        {newQuantity !== null && (
          <>
            {' '}
            → New: <strong>{formatNumber(newQuantity)}</strong>
          </>
        )}
      </p>

      {submitError && (
        <p className="error-message" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className={`button ${isDecrease ? 'button--danger' : 'button--primary'}`}
        disabled={Boolean(validationError) || isSubmitting}
      >
        {isSubmitting ? 'Saving...' : isDecrease ? 'Decrease stock' : 'Increase stock'}
      </button>
    </form>
  );
};

export default StockAdjustForm;
