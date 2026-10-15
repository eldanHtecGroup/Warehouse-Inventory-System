import { cloneElement, useId } from 'react';

// Label + control + hint/error. The single child (input/select/textarea) gets
// id, aria-invalid and aria-describedby wired up automatically.
const FormField = ({ label, error, hint, children }) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={error ? 'form-field__error' : 'form-field__hint'}>
          {message}
        </p>
      )}
    </div>
  );
};

export default FormField;
