import Modal from './Modal.jsx';

const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Delete', isPending, onConfirm, onCancel }) => (
  <Modal isOpen={isOpen} title={title} onClose={onCancel}>
    <p>{message}</p>
    <div className="form-actions">
      <button type="button" className="button" onClick={onCancel} disabled={isPending}>
        Cancel
      </button>
      <button type="button" className="button button--danger" onClick={onConfirm} disabled={isPending}>
        {isPending ? 'Working...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
