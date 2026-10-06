import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3 text-center">
      <div className="card-saas p-5 shadow-sm border-0" style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-primary mb-2">404</div>
        <h4 className="fw-bold text-dark mb-2">Page Not Found</h4>
        <p className="text-muted small mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-ll-primary justify-content-center">
          <i className="bi bi-house-door"></i> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
