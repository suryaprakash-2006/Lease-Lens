import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EmptyState Component
 *
 * Clean zero-state container with Space Grotesk heading, warm description, and CTA.
 *
 * @param {Object} props
 * @param {string} [props.icon='bi-inbox'] - Bootstrap icon class.
 * @param {string} [props.title='No records found'] - Heading.
 * @param {string} [props.description='There are no items to display right now.'] - Descriptive text.
 * @param {string} [props.actionText=null] - Button CTA label.
 * @param {string} [props.actionLink=null] - Router path to link to.
 * @param {Function} [props.onActionClick=null] - Click handler if no actionLink.
 */
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
      <h5 className="fw-bold mb-2 text-dark" style={{ fontFamily: 'var(--ll-heading-font)' }}>
        {title}
      </h5>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '440px', fontSize: '0.925rem', lineHeight: '1.5' }}>
        {description}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn-ll-primary">
          <i className="bi bi-plus-lg"></i>
          <span>{actionText}</span>
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button onClick={onActionClick} className="btn-ll-primary">
          <i className="bi bi-plus-lg"></i>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
