import React from 'react';

/**
 * LoadingSpinner Component
 *
 * Reusable loading indicator styled with LeaseLens terracotta accent token.
 *
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Descriptive loading text.
 * @param {boolean} [props.fullScreen=false] - If true, fills the entire viewport over warm canvas.
 */
const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{ width: '2.5rem', height: '2.5rem', color: 'var(--ll-primary)' }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-semibold mb-0" style={{ fontSize: '0.925rem' }}>
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="d-flex align-items-center justify-content-center min-vh-100"
        style={{ backgroundColor: 'var(--ll-canvas)' }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
