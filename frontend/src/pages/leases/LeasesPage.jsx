import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

const LeasesPage = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);

  const fetchLeases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leasesAPI.getAll({
        status,
        expiringSoon: expiringSoon ? 'true' : undefined
      });
      setLeases(response?.data?.leases || []);
    } catch (err) {
      console.error('[Leases] Error fetching leases:', err);
      setError(err.message || 'Failed to fetch leases.');
    } finally {
      setLoading(false);
    }
  }, [status, expiringSoon]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Lease Agreements</h3>
          <p className="text-muted small mb-0">
            Monitor tenant agreements, lease terms, and automated lifecycle milestones
          </p>
        </div>
        <div>
          <Link to="/leases/new" className="btn-ll-primary">
            <i className="bi bi-plus-lg"></i> Create Lease Agreement
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card-saas mb-4 p-3">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select-saas"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="form-check ms-md-3">
            <input
              type="checkbox"
              id="expiringSoonCheck"
              className="form-check-input"
              checked={expiringSoon}
              onChange={(e) => setExpiringSoon(e.target.checked)}
            />
            <label className="form-check-label fw-semibold small text-dark" htmlFor="expiringSoonCheck">
              Expiring Soon (within 30 days)
            </label>
          </div>

          {(status || expiringSoon) && (
            <button
              onClick={() => {
                setStatus('');
                setExpiringSoon(false);
              }}
              className="btn-ll-secondary ms-auto"
            >
              <i className="bi bi-x-circle"></i> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading lease agreements..." />
      ) : leases.length === 0 ? (
        <EmptyState
          icon="bi-file-earmark-text"
          title="No lease agreements found"
          description={
            status || expiringSoon
              ? 'No lease agreements match the selected criteria.'
              : 'You have not recorded any lease agreements yet. Create an agreement to assign tenants to your properties.'
          }
          actionText={status || expiringSoon ? 'Clear Filters' : 'Create Lease Agreement'}
          actionLink={status || expiringSoon ? null : '/leases/new'}
          onActionClick={
            status || expiringSoon
              ? () => {
                  setStatus('');
                  setExpiringSoon(false);
                }
              : null
          }
        />
      ) : (
        <div className="card-saas p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-saas">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Monthly Rent</th>
                  <th>Lease Period</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease._id}>
                    <td>
                      <div className="fw-bold text-dark">{lease.propertyId?.title || 'Property Unit'}</div>
                      <small className="text-muted">{lease.propertyId?.address?.city || ''}</small>
                    </td>
                    <td>
                      <div className="fw-semibold">{lease.tenant?.name}</div>
                      <small className="text-muted">{lease.tenant?.email} · {lease.tenant?.phone}</small>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">₹{lease.monthlyRent?.toLocaleString('en-IN')}</div>
                      <small className="text-muted">Deposit: ₹{lease.securityDeposit?.toLocaleString('en-IN')}</small>
                    </td>
                    <td>
                      <div className="small">
                        {new Date(lease.startDate).toLocaleDateString('en-IN')} -{' '}
                        {new Date(lease.endDate).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={lease.status} />
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/leases/${lease._id}`}
                        className="btn btn-sm btn-outline-secondary"
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeasesPage;
