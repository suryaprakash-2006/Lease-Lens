import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.75rem', height: '2.75rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-semibold mb-0">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
