import { useEffect, useId, useRef } from 'react';

// Native <dialog>: focus trapping, Esc to close and the backdrop come for free
const Modal = ({ isOpen, title, onClose, children }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onClose={onClose}>
      {isOpen && (
        <>
          <div className="modal__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal__body">{children}</div>
        </>
      )}
    </dialog>
  );
};

export default Modal;
