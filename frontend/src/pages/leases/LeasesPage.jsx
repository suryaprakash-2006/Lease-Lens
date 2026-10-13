import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';

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

  // Accurate summary metrics derived from real application data
  const totalCount = leases.length;
  const activeCount = leases.filter((l) => l.status === 'Active').length;
  const upcomingCount = leases.filter((l) => l.status === 'Upcoming').length;
  const expiredCount = leases.filter((l) => l.status === 'Expired').length;

  return (
    <div className="leases-page-container">
      {/* Standardized Reusable Page Header */}
      <PageHeader
        title="Lease Agreements"
        subtitle="Monitor tenant agreements, lease terms, and automated lifecycle milestones"
        badge={
          <span
            className="badge rounded-pill bg-light border text-muted px-2 py-1"
            style={{ fontSize: '0.72rem', borderColor: 'var(--ll-border)' }}
          >
            {leases.length} {leases.length === 1 ? 'Agreement' : 'Agreements'}
          </span>
        }
        actions={
          <Link to="/leases/new" className="btn-ll-primary">
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
            <span>Create Lease Agreement</span>
          </Link>
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Summary KPI Strip (when leases exist and no active filter) */}
      {!loading && leases.length > 0 && !hasActiveFilters && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <StatCard
              label="TOTAL LEASES"
              value={totalCount}
              icon="bi-file-earmark-text"
              variant="default"
              supportingText="All registered contracts"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="ACTIVE TENANCIES"
              value={activeCount}
              icon="bi-check-circle"
              variant="success"
              supportingText="Currently occupied"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="UPCOMING"
              value={upcomingCount}
              icon="bi-clock"
              variant="info"
              supportingText="Pending move-in"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="EXPIRED / PAST"
              value={expiredCount}
              icon="bi-hourglass-bottom"
              variant="warning"
              supportingText="Concluded contracts"
            />
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card-saas mb-4 p-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div style={{ minWidth: '190px' }}>
            <select
              className="form-select-saas"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by Lease Status"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="form-check form-switch pt-1">
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
              <i className="bi bi-x-circle"></i>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <LoadingSpinner message="Loading lease agreements..." />
      ) : leases.length === 0 ? (
        <EmptyState
          icon="bi-file-earmark-text"
          title="No lease agreements found"
          description={
            hasActiveFilters
              ? 'No lease agreements match the selected status or expiration criteria.'
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
                  <th>Tenant Profile</th>
                  <th>Monthly Rent</th>
                  <th>Lease Duration</th>
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
                      <div className="fw-bold text-dark tabular-nums">{formatINR(lease.monthlyRent)}/mo</div>
                      <small className="text-muted tabular-nums">
                        Deposit: {formatINR(lease.securityDeposit)}
                      </small>
                    </td>
                    <td>
                      <div className="small text-dark tabular-nums">
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
                          aria-label={`View agreement for ${lease.tenant?.name}`}
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        {lease.status === 'Active' && (
                          <button
                            onClick={() => setTerminatingLease(lease)}
                            className="btn btn-outline-warning"
                            title="Terminate Early"
                            aria-label={`Terminate lease for ${lease.tenant?.name}`}
                          >
                            <i className="bi bi-x-octagon"></i>
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingLease(lease)}
                          className="btn btn-outline-danger"
                          title="Delete Lease Record"
                          aria-label={`Delete lease record for ${lease.tenant?.name}`}
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
        message="Are you sure you want to permanently delete this lease record? This action cannot be reversed."
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
