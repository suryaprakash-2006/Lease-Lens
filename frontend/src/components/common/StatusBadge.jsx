import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase().replace(/\s+/g, '');

  let badgeClass = 'available';
  let icon = 'bi-check-circle-fill';

  switch (normalized) {
    case 'available':
    case 'active':
      badgeClass = 'active';
      icon = 'bi-check-circle-fill';
      break;
    case 'rented':
    case 'upcoming':
      badgeClass = 'upcoming';
      icon = 'bi-clock-fill';
      break;
    case 'undermaintenance':
    case 'expired':
      badgeClass = 'expired';
      icon = 'bi-exclamation-circle-fill';
      break;
    case 'terminated':
      badgeClass = 'terminated';
      icon = 'bi-x-circle-fill';
      break;
    default:
      badgeClass = 'available';
      icon = 'bi-info-circle-fill';
  }

  return (
    <span className={`badge-status ${badgeClass}`}>
      <i className={`bi ${icon}`}></i>
      {status}
    </span>
  );
};

export default StatusBadge;
