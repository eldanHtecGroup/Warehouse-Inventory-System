const ErrorMessage = ({ error, onRetry }) => (
  <div className="error-message" role="alert">
    <p>{error?.message || 'Something went wrong.'}</p>
    {Array.isArray(error?.details) && (
      <ul>
        {error.details.map((detail) => (
          <li key={`${detail.field}-${detail.message}`}>{detail.message}</li>
        ))}
      </ul>
    )}
    {onRetry && (
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export default ErrorMessage;
