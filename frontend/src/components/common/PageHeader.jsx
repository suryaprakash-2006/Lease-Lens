import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PageHeader Component
 *
 * A standardized, reusable page-header component for LeaseLens pages.
 * Displays page title in Space Grotesk, optional subtitle, optional breadcrumb,
 * optional badge / counter, and an optional action slot for buttons/controls.
 *
 * @param {Object} props
 * @param {string} props.title - Primary page heading (required).
 * @param {string} [props.subtitle] - Supporting descriptive text below the title.
 * @param {React.ReactNode} [props.badge] - Optional badge or status element placed beside the title.
 * @param {Array<{label: string, to?: string}>|React.ReactNode} [props.breadcrumb] - Breadcrumb hierarchy items or custom breadcrumb element.
 * @param {React.ReactNode} [props.actions] - Action buttons or controls rendered on the right side.
 * @param {string} [props.className] - Additional CSS class names for the container.
 * @returns {JSX.Element}
 */
const PageHeader = ({
  title,
  subtitle = null,
  badge = null,
  breadcrumb = null,
  actions = null,
  className = ''
}) => {
  if (!title) return null;

  const renderBreadcrumb = () => {
    if (!breadcrumb) return null;

    if (Array.isArray(breadcrumb)) {
      return (
        <nav aria-label="breadcrumb" className="page-header-breadcrumb mb-2">
          <ol className="breadcrumb mb-0" style={{ fontSize: '0.8rem' }}>
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li
                  key={index}
                  className={`breadcrumb-item ${isLast ? 'active text-muted' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.to && !isLast ? (
                    <Link to={item.to} className="text-decoration-none text-muted">
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      );
    }

    return <div className="page-header-breadcrumb mb-2">{breadcrumb}</div>;
  };

  return (
    <div
      className={`page-header-container d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 ${className}`.trim()}
    >
      <div>
        {renderBreadcrumb()}
        <div className="d-flex align-items-center flex-wrap gap-2">
          <h3 className="page-header-title fw-bold mb-0">{title}</h3>
          {badge && <div className="page-header-badge">{badge}</div>}
        </div>
        {subtitle && (
          <p className="page-header-subtitle text-muted small mb-0 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="page-header-actions d-flex align-items-center flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
