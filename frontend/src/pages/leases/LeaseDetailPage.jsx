import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

const LeaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLease = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leasesAPI.getById(id);
      setLease(response?.data || null);
    } catch (err) {
      console.error('[LeaseDetail] Error fetching details:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLease();
  }, [fetchLease]);

  const handleTerminateConfirm = async () => {
    setTerminateLoading(true);
    setError(null);
    try {
      const res = await leasesAPI.updateStatus(id, 'Terminated');
      setLease(res?.data || null);
      setShowTerminateModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setShowTerminateModal(false);
    } finally {
      setTerminateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setError(null);
    try {
      await leasesAPI.delete(id);
      setShowDeleteModal(false);
      navigate('/leases');
    } catch (err) {
      setError(getErrorMessage(err));
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching lease agreement..." />;

  if (!lease) {
    return (
      <div className="text-center p-5">
        <ErrorAlert message={error || 'Lease agreement not found.'} />
        <Link to="/leases" className="btn-ll-secondary mt-3">
          <i className="bi bi-arrow-left"></i> Back to Leases
        </Link>
      </div>
    );
  }

  return (
    <div className="lease-detail-container" style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Standardized PageHeader with Breadcrumb */}
      <PageHeader
        title="Lease Agreement Details"
        subtitle={`Contract for ${lease.tenant?.name || 'Tenant'} · ${lease.propertyId?.title || 'Property Unit'}`}
        breadcrumb={[
          { label: 'Lease Agreements', to: '/leases' },
          { label: lease.tenant?.name ? `Lease — ${lease.tenant.name}` : 'Agreement' }
        ]}
        badge={<StatusBadge status={lease.status} />}
        actions={
          <div className="d-flex align-items-center gap-2">
            {lease.status === 'Active' && (
              <button
                onClick={() => setShowTerminateModal(true)}
                className="btn btn-outline-warning d-inline-flex align-items-center gap-2 rounded-2 px-3 py-2 fw-semibold"
                style={{ fontSize: '0.875rem' }}
                aria-label="Terminate this lease agreement early"
              >
                <i className="bi bi-x-octagon" aria-hidden="true"></i>
                <span>Terminate Early</span>
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline-danger d-inline-flex align-items-center gap-2 rounded-2 px-3 py-2 fw-semibold"
              style={{ fontSize: '0.875rem' }}
              aria-label="Delete this lease record"
            >
              <i className="bi bi-trash3" aria-hidden="true"></i>
              <span>Delete</span>
            </button>
          </div>
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Property & Tenant Overview Row */}
      <div className="row g-4 mb-4">
        {/* Associated Property Card */}
        <div className="col-md-6">
          <div className="card-saas h-100">
            <div className="form-section-header">
              <i className="bi bi-building text-muted"></i>
              <span>Associated Property Unit</span>
            </div>

            <div className="mb-2">
              <Link
                to={`/properties/${lease.propertyId?._id}`}
                className="fw-bold fs-5 text-dark text-decoration-none"
              >
                {lease.propertyId?.title}
              </Link>
            </div>
            <div className="text-muted small mb-3">
              {lease.propertyId?.address?.locality}, {lease.propertyId?.address?.city}
            </div>
            <div className="d-flex align-items-center gap-2 mt-auto">
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--ll-surface-subtle)',
                  color: 'var(--ll-text-primary)',
                  border: '1px solid var(--ll-border)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {lease.propertyId?.bhk} BHK {lease.propertyId?.propertyType}
              </span>
              <StatusBadge status={lease.propertyId?.status} />
            </div>
          </div>
        </div>

        {/* Tenant Profile Card */}
        <div className="col-md-6">
          <div className="card-saas h-100">
            <div className="form-section-header">
              <i className="bi bi-person-badge text-muted"></i>
              <span>Tenant Profile</span>
            </div>

            <div className="fw-bold fs-5 text-dark mb-1">{lease.tenant?.name}</div>
            <div className="text-muted small mb-1">
              <i className="bi bi-envelope me-1" aria-hidden="true"></i>
              <span>{lease.tenant?.email}</span>
            </div>
            <div className="text-muted small mb-1">
              <i className="bi bi-telephone me-1" aria-hidden="true"></i>
              <span className="tabular-nums">{lease.tenant?.phone}</span>
            </div>
            <div className="text-muted small mt-2">
              <i className="bi bi-people me-1" aria-hidden="true"></i>
              <span>Registered Occupants: <strong>{lease.tenant?.occupantsCount || 1} Person(s)</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Terms & Agreement Timeline Card */}
      <div className="card-saas mb-4">
        <div className="form-section-header">
          <i className="bi bi-cash-coin text-muted"></i>
          <span>Financial Terms & Agreement Timeline</span>
        </div>

        <div className="row g-4">
          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Agreed Monthly Rent</div>
            <div className="detail-spec-value tabular-nums text-primary" style={{ fontSize: '1.25rem' }}>
              {formatINR(lease.monthlyRent)} <span className="text-muted fs-6 fw-normal">/ mo</span>
            </div>
          </div>

          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Security Deposit Held</div>
            <div className="detail-spec-value tabular-nums" style={{ fontSize: '1.25rem' }}>
              {formatINR(lease.securityDeposit)}
            </div>
          </div>

          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Rent Payment Schedule</div>
            <div className="detail-spec-value">
              Day {lease.paymentDueDay || 1} of each month
            </div>
          </div>

          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Commencement (Start) Date</div>
            <div className="detail-spec-value tabular-nums">{formatDate(lease.startDate)}</div>
          </div>

          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Expiration (End) Date</div>
            <div className="detail-spec-value tabular-nums">{formatDate(lease.endDate)}</div>
          </div>

          <div className="col-6 col-sm-4">
            <div className="detail-spec-label">Notice Period Required</div>
            <div className="detail-spec-value">{lease.noticePeriodDays || 30} Days prior notice</div>
          </div>
        </div>

        {lease.importantTerms && lease.importantTerms.length > 0 && (
          <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--ll-border)' }}>
            <div className="detail-spec-label mb-2">Key Agreement Clauses & Terms</div>
            <ul className="mb-0 ps-3 small text-muted" style={{ lineHeight: '1.6' }}>
              {lease.importantTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        )}

        {lease.notes && (
          <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--ll-border)' }}>
            <div className="detail-spec-label mb-1">Internal Management Notes</div>
            <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
              {lease.notes}
            </p>
          </div>
        )}
      </div>

      {/* Terminate Confirmation Modal */}
      <ConfirmModal
        isOpen={showTerminateModal}
        title="Terminate Active Lease?"
        message={`Are you sure you want to terminate this lease agreement early for tenant '${lease.tenant?.name}'? This will mark the lease status as 'Terminated' and restore property unit availability.`}
        confirmText="Confirm Termination"
        confirmVariant="warning"
        confirmIcon="bi-x-octagon"
        loading={terminateLoading}
        onConfirm={handleTerminateConfirm}
        onCancel={() => setShowTerminateModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Lease Record?"
        message="Are you sure you want to permanently delete this lease contract? This action cannot be reversed."
        confirmText="Confirm Delete"
        confirmVariant="danger"
        confirmIcon="bi-trash3"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default LeaseDetailPage;
