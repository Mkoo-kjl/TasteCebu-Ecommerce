import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose} aria-label="Close">
          <FiX size={18} />
        </button>
        <div className={`confirm-modal-icon confirm-icon-${variant}`}>
          <FiAlertTriangle size={28} />
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-ghost confirm-modal-cancel" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            className={`btn confirm-modal-confirm btn-${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
