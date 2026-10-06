import React from 'react';

const ErrorAlert = ({ message, details = null, onDismiss = null }) => {
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex align-items-start gap-3 rounded-3 shadow-sm border-0 my-3" role="alert">
      <i className="bi bi-exclamation-triangle-fill text-danger fs-4 mt-1"></i>
      <div className="flex-grow-1">
        <div className="fw-semibold text-danger">{message}</div>
        {Array.isArray(details) && details.length > 0 && (
          <ul className="mt-2 mb-0 ps-3 small text-danger-emphasis">
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
