import React from 'react';

/**
 * ConfirmModal Component
 *
 * Accessible confirmation dialog with warm backdrop, styled with LeaseLens tokens.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility.
 * @param {string} [props.title='Confirm Action'] - Dialog title.
 * @param {string} [props.message='Are you sure you want to proceed with this action?'] - Description.
 * @param {string} [props.confirmText='Confirm'] - Confirmation CTA label.
 * @param {string} [props.confirmVariant='danger'] - Variant ('danger' | 'primary').
 * @param {string} [props.confirmIcon='bi-exclamation-circle'] - Bootstrap icon class.
 * @param {boolean} [props.loading=false] - If true, displays spinner and disables actions.
 * @param {Function} props.onConfirm - Confirm handler.
 * @param {Function} props.onCancel - Cancel handler.
 */
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

  const getConfirmBtnClass = () => {
    if (confirmVariant === 'danger') {
      return 'btn btn-sm btn-danger px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2';
    }
    return 'btn-ll-primary px-3 py-2 fw-semibold';
  };

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(24, 22, 21, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div
          className="modal-content border-0 shadow-lg rounded-3 overflow-hidden"
          style={{ backgroundColor: 'var(--ll-surface)', border: '1px solid var(--ll-border)' }}
        >
          {/* Header */}
          <div
            className="modal-header py-3 px-4"
            style={{ borderBottom: '1px solid var(--ll-border)', backgroundColor: 'var(--ll-surface)' }}
          >
            <h5
              className="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-0"
              style={{ fontFamily: 'var(--ll-heading-font)' }}
            >
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
            <p className="mb-0" style={{ fontSize: '0.925rem', lineHeight: '1.55', color: 'var(--ll-text-secondary)' }}>
              {message}
            </p>
          </div>

          {/* Footer */}
          <div
            className="modal-footer py-3 px-4"
            style={{ borderTop: '1px solid var(--ll-border)', backgroundColor: 'var(--ll-surface-subtle)' }}
          >
            <button
              type="button"
              className="btn-ll-secondary py-2 px-3 fw-semibold"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={getConfirmBtnClass()}
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
