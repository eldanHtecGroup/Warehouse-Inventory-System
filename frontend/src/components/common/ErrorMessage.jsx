const ErrorMessage = ({ error, onRetry }) => (
  <div className="error-message" role="alert">
    <p>{error?.message || 'Something went wrong.'}</p>
    {onRetry && (
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export default ErrorMessage;
