import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const LeasesPage = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);

  // Modal states for termination and deletion
  const [terminatingLease, setTerminatingLease] = useState(null);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [deletingLease, setDeletingLease] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, expiringSoon]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  const handleTerminateConfirm = async () => {
    if (!terminatingLease) return;
    setTerminateLoading(true);
    setError(null);
    try {
      await leasesAPI.updateStatus(terminatingLease._id, 'Terminated');
      setTerminatingLease(null);
      fetchLeases();
    } catch (err) {
      setError(getErrorMessage(err));
      setTerminatingLease(null);
    } finally {
      setTerminateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLease) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await leasesAPI.delete(deletingLease._id);
      setDeletingLease(null);
      fetchLeases();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeletingLease(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters = Boolean(status || expiringSoon);

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
        <div className="d-flex flex-wrap gap-3 align-items-center">
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

          <div className="form-check">
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

          {hasActiveFilters && (
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
            hasActiveFilters
              ? 'No lease agreements match the selected criteria.'
              : 'You have not recorded any lease agreements yet. Create an agreement to assign tenants to your properties.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Create Lease Agreement'}
          actionLink={hasActiveFilters ? null : '/leases/new'}
          onActionClick={
            hasActiveFilters
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
                  <th>Property Unit</th>
                  <th>Tenant Details</th>
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
                      <Link to={`/leases/${lease._id}`} className="fw-bold text-dark text-decoration-none">
                        {lease.propertyId?.title || 'Property Unit'}
                      </Link>
                      <div>
                        <small className="text-muted">{lease.propertyId?.address?.city || ''}</small>
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{lease.tenant?.name}</div>
                      <small className="text-muted">
                        {lease.tenant?.email} · {lease.tenant?.phone}
                      </small>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{formatINR(lease.monthlyRent)}/mo</div>
                      <small className="text-muted">Deposit: {formatINR(lease.securityDeposit)}</small>
                    </td>
                    <td>
                      <div className="small text-dark font-monospace">
                        {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={lease.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/leases/${lease._id}`}
                          className="btn btn-outline-secondary"
                          title="View Agreement"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        {lease.status === 'Active' && (
                          <button
                            onClick={() => setTerminatingLease(lease)}
                            className="btn btn-outline-warning"
                            title="Terminate Early"
                          >
                            <i className="bi bi-x-octagon"></i>
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingLease(lease)}
                          className="btn btn-outline-danger"
                          title="Delete Lease Record"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Terminate Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(terminatingLease)}
        title="Terminate Lease Agreement?"
        message={`Are you sure you want to terminate the lease for tenant '${terminatingLease?.tenant?.name}' on property '${terminatingLease?.propertyId?.title}'? This will transition status to 'Terminated' and restore property availability.`}
        confirmText="Terminate Lease"
        confirmVariant="warning"
        confirmIcon="bi-x-octagon"
        loading={terminateLoading}
        onConfirm={handleTerminateConfirm}
        onCancel={() => setTerminatingLease(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingLease)}
        title="Delete Lease Agreement?"
        message={`Are you sure you want to permanently delete this lease record? This action cannot be undone.`}
        confirmText="Delete Lease"
        confirmVariant="danger"
        confirmIcon="bi-trash3"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingLease(null)}
      />
    </div>
  );
};

export default LeasesPage;
