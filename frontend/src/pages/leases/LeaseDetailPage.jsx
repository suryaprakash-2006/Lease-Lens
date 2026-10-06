import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

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
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <Link to="/leases" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-2 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Leases
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-bold mb-0">Lease Agreement Details</h3>
            <StatusBadge status={lease.status} />
          </div>
        </div>
        <div className="d-flex gap-2">
          {lease.status === 'Active' && (
            <button
              onClick={() => setShowTerminateModal(true)}
              className="btn btn-outline-warning d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 fw-semibold"
            >
              <i className="bi bi-x-octagon"></i> Terminate Early
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-outline-danger d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 fw-semibold"
          >
            <i className="bi bi-trash3"></i> Delete
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Property & Tenant Row */}
      <div className="row g-4 mb-4">
        {/* Associated Property */}
        <div className="col-md-6">
          <div className="card-saas h-100">
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Property Unit</h6>
            <div className="mb-2">
              <Link to={`/properties/${lease.propertyId?._id}`} className="fw-bold fs-5 text-dark text-decoration-none">
                {lease.propertyId?.title}
              </Link>
            </div>
            <div className="text-muted small mb-2">
              {lease.propertyId?.address?.locality}, {lease.propertyId?.address?.city}
            </div>
            <div className="d-flex gap-2 mt-3">
              <span className="badge bg-light text-dark border">
                {lease.propertyId?.bhk} BHK {lease.propertyId?.propertyType}
              </span>
              <StatusBadge status={lease.propertyId?.status} />
            </div>
          </div>
        </div>

        {/* Tenant Information */}
        <div className="col-md-6">
          <div className="card-saas h-100">
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Tenant Profile</h6>
            <div className="fw-bold fs-5 text-dark mb-1">{lease.tenant?.name}</div>
            <div className="text-muted small mb-1">
              <i className="bi bi-envelope me-1"></i> {lease.tenant?.email}
            </div>
            <div className="text-muted small mb-1">
              <i className="bi bi-telephone me-1"></i> {lease.tenant?.phone}
            </div>
            <div className="text-muted small">
              <i className="bi bi-people me-1"></i> Occupants: <strong>{lease.tenant?.occupantsCount || 1} Person(s)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Terms & Timeline */}
      <div className="card-saas mb-4">
        <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Financial Terms & Timeline</h6>
        <div className="row g-3">
          <div className="col-6 col-sm-4">
            <span className="text-muted small">Agreed Monthly Rent:</span>
            <div className="fw-bold fs-4 text-primary">{formatINR(lease.monthlyRent)} / mo</div>
          </div>

          <div className="col-6 col-sm-4">
            <span className="text-muted small">Security Deposit Held:</span>
            <div className="fw-bold fs-4 text-dark">{formatINR(lease.securityDeposit)}</div>
          </div>

          <div className="col-6 col-sm-4">
            <span className="text-muted small">Rent Due Day:</span>
            <div className="fw-semibold text-dark fs-5">Day {lease.paymentDueDay || 1} of month</div>
          </div>

          <div className="col-6 col-sm-4">
            <span className="text-muted small">Commencement (Start) Date:</span>
            <div className="fw-semibold text-dark">{formatDate(lease.startDate)}</div>
          </div>

          <div className="col-6 col-sm-4">
            <span className="text-muted small">Expiration (End) Date:</span>
            <div className="fw-semibold text-dark">{formatDate(lease.endDate)}</div>
          </div>

          <div className="col-6 col-sm-4">
            <span className="text-muted small">Required Notice Period:</span>
            <div className="fw-semibold text-dark">{lease.noticePeriodDays || 30} Days</div>
          </div>
        </div>

        {lease.importantTerms && lease.importantTerms.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <span className="text-muted small d-block mb-2">Key Agreement Clauses:</span>
            <ul className="mb-0 ps-3 small text-muted">
              {lease.importantTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        )}

        {lease.notes && (
          <div className="mt-4 pt-3 border-top">
            <span className="text-muted small d-block mb-1">Internal Lease Notes:</span>
            <p className="text-muted small mb-0">{lease.notes}</p>
          </div>
        )}
      </div>

      {/* Terminate Modal */}
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

      {/* Delete Modal */}
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
