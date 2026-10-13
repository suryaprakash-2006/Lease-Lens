import React from 'react';

/**
 * StatCard Component
 *
 * A reusable, purely presentational KPI statistic card for LeaseLens dashboards and overviews.
 * Displays a metric label, prominent numerical or monetary value (formatted with tabular figures),
 * optional supporting context, optional icon badge, and optional trend indicator.
 *
 * This component does NOT fetch data, introduce mock values, or alter business logic.
 *
 * @param {Object} props
 * @param {string} props.label - Uppercase metric title/label (required).
 * @param {string|number} props.value - Primary quantitative metric or formatted string (required).
 * @param {React.ReactNode|string} [props.supportingText] - Contextual secondary info (e.g. breakdown, subtitle).
 * @param {string|React.ReactNode} [props.icon] - Bootstrap icon class name (e.g. 'bi-building') or icon JSX node.
 * @param {Object|React.ReactNode} [props.trend] - Trend data { direction: 'up'|'down'|'neutral', label: string, positive?: boolean } or custom node.
 * @param {'default'|'primary'|'success'|'warning'|'info'} [props.variant='default'] - Visual accent theme for icon background.
 * @param {string} [props.className=''] - Additional CSS classes for the card container.
 * @returns {JSX.Element}
 */
const StatCard = ({
  label,
  value,
  supportingText = null,
  icon = null,
  trend = null,
  variant = 'default',
  className = ''
}) => {
  // Determine variant-specific icon container styles
  const getIconWrapperClass = () => {
    switch (variant) {
      case 'primary':
        return 'stat-icon-primary';
      case 'success':
        return 'stat-icon-success';
      case 'warning':
        return 'stat-icon-warning';
      case 'info':
        return 'stat-icon-info';
      case 'default':
      default:
        return 'stat-icon-default';
    }
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <div className={`stat-icon-wrapper ${getIconWrapperClass()}`}>
        {typeof icon === 'string' ? <i className={`bi ${icon}`}></i> : icon}
      </div>
    );
  };

  const renderTrend = () => {
    if (!trend) return null;

    if (React.isValidElement(trend)) {
      return trend;
    }

    if (typeof trend === 'object' && trend.label) {
      const isPositive = trend.positive !== undefined ? trend.positive : trend.direction === 'up';
      const trendColorClass = isPositive ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-muted';
      const trendIcon =
        trend.direction === 'up'
          ? 'bi-arrow-up-short'
          : trend.direction === 'down'
          ? 'bi-arrow-down-short'
          : 'bi-dash';

      return (
        <span className={`stat-trend d-inline-flex align-items-center small fw-semibold ${trendColorClass}`}>
          <i className={`bi ${trendIcon} fs-6`}></i>
          <span>{trend.label}</span>
        </span>
      );
    }

    return null;
  };

  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-content flex-grow-1">
        <div className="stat-label mb-1">{label}</div>
        <div className="stat-value tabular-nums">{value}</div>

        {(supportingText || trend) && (
          <div className="stat-footer d-flex align-items-center flex-wrap gap-2 mt-2">
            {renderTrend()}
            {supportingText && (
              <div className="stat-supporting-text small text-muted">
                {supportingText}
              </div>
            )}
          </div>
        )}
      </div>

      {renderIcon()}
    </div>
  );
};

export default StatCard;
