import React from 'react';

/**
 * ErrorAlert Component
 *
 * Dismissible error alert banner with support for validation error details.
 * Styled with warm earthy danger tokens from the LeaseLens design system.
 *
 * @param {Object} props
 * @param {string} props.message - Primary error message.
 * @param {Array<{field?: string, message: string}>|Array<string>} [props.details=null] - Optional detailed validation items.
 * @param {Function} [props.onDismiss=null] - Optional dismiss callback.
 */
const ErrorAlert = ({ message, details = null, onDismiss = null }) => {
  if (!message) return null;

  return (
    <div
      className="alert d-flex align-items-start gap-3 rounded-3 shadow-sm my-3"
      role="alert"
      style={{
        backgroundColor: 'var(--ll-danger-bg)',
        border: '1px solid var(--ll-danger-border)',
        color: 'var(--ll-danger)'
      }}
    >
      <i className="bi bi-exclamation-triangle-fill fs-5 mt-1" style={{ color: 'var(--ll-danger)' }}></i>
      <div className="flex-grow-1">
        <div className="fw-semibold" style={{ color: 'var(--ll-danger)', fontSize: '0.925rem' }}>
          {message}
        </div>
        {Array.isArray(details) && details.length > 0 && (
          <ul className="mt-2 mb-0 ps-3 small" style={{ color: 'var(--ll-danger)' }}>
            {details.map((item, idx) => (
              <li key={idx}>
                {item.field ? <strong>{item.field}: </strong> : null}
                {item.message || item}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  );
};

export default ErrorAlert;
