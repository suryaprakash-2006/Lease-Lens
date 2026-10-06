/**
 * LeaseLens Formatting & Normalization Utilities
 */

/**
 * Format numeric value as Indian Rupee (INR / ₹)
 * @param {number|string} amount
 * @returns {string} e.g. "₹45,000"
 */
export const formatINR = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return '₹0';
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Format ISO date string into readable Date (e.g., "15 Oct 2026")
 * @param {string|Date} dateInput
 * @param {object} options
 * @returns {string}
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
};

/**
 * Format relative countdown for days remaining
 * @param {number} days
 * @returns {string}
 */
export const formatDaysRemaining = (days) => {
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day remaining';
  if (days < 0) return 'Expired';
  return `${days} days remaining`;
};

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Normalize backend error response into a clean user-facing string
 * @param {Error|object} err
 * @returns {string}
 */
export const getErrorMessage = (err) => {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;

  // Handle specific backend conflict cases
  if (err.statusCode === 409) {
    if (err.message && err.message.toLowerCase().includes('active lease')) {
      return 'Cannot delete this property because it is currently assigned to an Active lease agreement. Please terminate or expire the lease first.';
    }
    return err.message || 'A conflicting record already exists.';
  }

  if (err.statusCode === 404) {
    return err.message || 'Requested resource not found or access denied.';
  }

  if (err.statusCode === 401) {
    return 'Your session has expired. Please log in again.';
  }

  return err.message || 'An error occurred while processing your request.';
};
