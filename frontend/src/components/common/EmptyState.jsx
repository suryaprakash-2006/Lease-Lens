import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  description = 'There are no items to display right now.',
  actionText = null,
  actionLink = null,
  onActionClick = null
}) => {
  return (
    <div className="empty-state-card my-3">
      <div className="empty-state-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <h5 className="fw-bold mb-2">{title}</h5>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn-ll-primary">
          <i className="bi bi-plus-lg"></i>
          {actionText}
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button onClick={onActionClick} className="btn-ll-primary">
          <i className="bi bi-plus-lg"></i>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
