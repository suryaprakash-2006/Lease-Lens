import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leasesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

const LeaseDetailPage = () => {
  const { id } = useParams();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchLease = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leasesAPI.getById(id);
      setLease(response?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load lease agreement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLease();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to transition this lease to '${newStatus}'?`)) {
      return;
    }
    setStatusUpdating(true);
    try {
      const res = await leasesAPI.updateStatus(id, newStatus);
      setLease(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to update lease status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching lease details..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!lease) return <div className="text-center p-5 text-muted">Lease agreement not found.</div>;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/leases" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Leases
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-bold mb-0">Lease Agreement Details</h3>
            <StatusBadge status={lease.status} />
          </div>
        </div>
        <div>
          {lease.status === 'Active' && (
            <button
              onClick={() => handleStatusChange('Terminated')}
              disabled={statusUpdating}
              className="btn btn-sm btn-outline-danger"
            >
              <i className="bi bi-x-octagon"></i> Terminate Early
            </button>
          )}
        </div>
      </div>

      <div className="card-saas mb-4">
        <h5 className="fw-bold mb-3 border-bottom pb-2">Property & Tenant</h5>
        <div className="row g-3">
          <div className="col-sm-6">
            <span className="text-muted small">Associated Property:</span>
            <div className="fw-bold fs-6">{lease.propertyId?.title}</div>
            <div className="text-muted small">{lease.propertyId?.address?.locality}, {lease.propertyId?.address?.city}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Primary Tenant:</span>
            <div className="fw-bold fs-6">{lease.tenant?.name}</div>
            <div className="text-muted small">{lease.tenant?.email} · {lease.tenant?.phone}</div>
          </div>
        </div>
      </div>

      <div className="card-saas mb-4">
        <h5 className="fw-bold mb-3 border-bottom pb-2">Financial Terms & Timeline</h5>
        <div className="row g-3">
          <div className="col-sm-6">
            <span className="text-muted small">Monthly Rent:</span>
            <div className="fw-bold fs-5 text-primary">₹{lease.monthlyRent?.toLocaleString('en-IN')}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Security Deposit:</span>
            <div className="fw-bold fs-5 text-dark">₹{lease.securityDeposit?.toLocaleString('en-IN')}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Start Date:</span>
            <div className="fw-semibold">{new Date(lease.startDate).toLocaleDateString('en-IN')}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">End Date:</span>
            <div className="fw-semibold">{new Date(lease.endDate).toLocaleDateString('en-IN')}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Notice Period:</span>
            <div className="fw-semibold">{lease.noticePeriodDays || 30} Days</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Rent Due Day:</span>
            <div className="fw-semibold">Day {lease.paymentDueDay || 1} of every month</div>
          </div>
        </div>

        {lease.importantTerms && lease.importantTerms.length > 0 && (
          <div className="mt-4">
            <span className="text-muted small d-block mb-2">Key Agreement Clauses:</span>
            <ul className="mb-0 ps-3 small text-muted">
              {lease.importantTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseDetailPage;
