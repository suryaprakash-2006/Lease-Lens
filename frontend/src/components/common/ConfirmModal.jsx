import React from 'react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  confirmIcon = 'bi-exclamation-circle',
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-0">
              <i className={`bi ${confirmIcon} text-${confirmVariant} fs-5`}></i>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
              disabled={loading}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-muted">
            <p className="mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top py-3 px-4 bg-light">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-3 py-2 fw-semibold"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-${confirmVariant} px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className={`bi ${confirmIcon}`}></i>
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
