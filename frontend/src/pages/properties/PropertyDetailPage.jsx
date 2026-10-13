import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertiesAPI.getById(id);
      setData(response?.data || null);
    } catch (err) {
      console.error('[PropertyDetail] Error fetching details:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setError(null);
    try {
      await propertiesAPI.delete(id);
      setShowDeleteModal(false);
      navigate('/properties');
    } catch (err) {
      setError(getErrorMessage(err));
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching property details..." />;

  if (!data?.property) {
    return (
      <div className="text-center p-5">
        <ErrorAlert message={error || 'Property not found.'} />
        <Link to="/properties" className="btn-ll-secondary mt-3">
          <i className="bi bi-arrow-left"></i> Back to Properties
        </Link>
      </div>
    );
  }

  const { property, activeLease, expenseSummary } = data;

  return (
    <div className="property-detail-container">
      {/* Standardized PageHeader with Breadcrumb */}
      <PageHeader
        title={property.title}
        subtitle={`${property.bhk} BHK ${property.propertyType} in ${property.address?.locality}, ${property.address?.city}`}
        breadcrumb={[
          { label: 'Properties', to: '/properties' },
          { label: property.title }
        ]}
        badge={<StatusBadge status={property.status} />}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to={`/properties/${property._id}/edit`} className="btn-ll-secondary">
              <i className="bi bi-pencil" aria-hidden="true"></i>
              <span>Edit Property</span>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline-danger d-inline-flex align-items-center gap-2 rounded-2 px-3 py-2 fw-semibold"
              style={{ fontSize: '0.9rem' }}
              aria-label="Delete this property listing"
            >
              <i className="bi bi-trash3" aria-hidden="true"></i>
              <span>Delete</span>
            </button>
          </div>
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      <div className="row g-4">
        {/* Main Specifications & Lease Column */}
        <div className="col-lg-8">
          {/* Property Specifications Card */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-sliders text-muted"></i>
              <span>Property Specifications</span>
            </div>

            <div className="row g-4">
              <div className="col-sm-6">
                <div className="detail-spec-label">Locality & City</div>
                <div className="detail-spec-value">
                  {property.address?.locality}, {property.address?.city}
                </div>
                {property.address?.state && (
                  <small className="text-muted">
                    {property.address.state} {property.address.pincode && `· PIN: ${property.address.pincode}`}
                  </small>
                )}
              </div>

              <div className="col-sm-6">
                <div className="detail-spec-label">Configuration & Type</div>
                <div className="detail-spec-value">
                  {property.bhk} BHK {property.propertyType}
                </div>
                <small className="text-muted">
                  {property.bedrooms} Bedrooms · {property.bathrooms} Bathrooms
                </small>
              </div>

              <div className="col-sm-6">
                <div className="detail-spec-label">Super Built-up Area</div>
                <div className="detail-spec-value tabular-nums">{property.areaSqFt} sq. ft.</div>
              </div>

              <div className="col-sm-6">
                <div className="detail-spec-label">Listed Rental Valuation</div>
                <div className="detail-spec-value tabular-nums text-primary" style={{ fontSize: '1.25rem' }}>
                  {formatINR(property.listedRent)} <span className="text-muted fs-6 fw-normal">/ month</span>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="detail-spec-label">Furnishing Status</div>
                <div className="detail-spec-value">{property.furnishingStatus}</div>
              </div>

              <div className="col-sm-6">
                <div className="detail-spec-label">Parking Allocation</div>
                <div className="detail-spec-value">
                  {property.parking ? 'Dedicated Covered Parking' : 'Street Parking / None'}
                </div>
              </div>
            </div>

            {property.description && (
              <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--ll-border)' }}>
                <div className="detail-spec-label">Description & Overview</div>
                <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
                  {property.description}
                </p>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--ll-border)' }}>
                <div className="detail-spec-label mb-2">Amenities & Facilities</div>
                <div className="d-flex flex-wrap gap-2">
                  {property.amenities.map((am, idx) => (
                    <span
                      key={idx}
                      className="badge d-inline-flex align-items-center gap-1 px-3 py-2"
                      style={{
                        backgroundColor: 'var(--ll-surface-subtle)',
                        color: 'var(--ll-text-secondary)',
                        border: '1px solid var(--ll-border)',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      <i className="bi bi-check2 text-success" aria-hidden="true"></i>
                      <span>{am}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Lease Section Card */}
          <div className="card-saas">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2" style={{ borderColor: 'var(--ll-border)' }}>
              <div className="form-section-header mb-0 border-0 p-0">
                <i className="bi bi-file-earmark-text text-muted"></i>
                <span>Active Tenancy Agreement</span>
              </div>
              {property.status === 'Available' && !activeLease && (
                <Link to="/leases/new" className="btn-ll-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}>
                  <i className="bi bi-plus-lg"></i>
                  <span>Create Lease</span>
                </Link>
              )}
            </div>

            {activeLease ? (
              <div
                className="p-3 rounded-3"
                style={{
                  backgroundColor: 'var(--ll-canvas)',
                  border: '1px solid var(--ll-border)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold fs-6 text-dark">Tenant: {activeLease.tenant?.name}</div>
                  <StatusBadge status={activeLease.status} />
                </div>
                <div className="text-muted small mb-3">
                  Email: <strong>{activeLease.tenant?.email}</strong> · Phone: <strong>{activeLease.tenant?.phone}</strong>
                </div>
                <div className="row g-3 small">
                  <div className="col-6 col-sm-3">
                    <span className="text-muted d-block">Agreed Rent:</span>
                    <strong className="text-dark tabular-nums">{formatINR(activeLease.monthlyRent)}/mo</strong>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted d-block">Security Deposit:</span>
                    <strong className="text-dark tabular-nums">{formatINR(activeLease.securityDeposit)}</strong>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted d-block">Start Date:</span>
                    <span className="text-dark tabular-nums">{formatDate(activeLease.startDate)}</span>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted d-block">End Date:</span>
                    <span className="text-dark tabular-nums">{formatDate(activeLease.endDate)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-top text-end" style={{ borderColor: 'var(--ll-border)' }}>
                  <Link
                    to={`/leases/${activeLease._id}`}
                    className="btn btn-sm btn-link text-decoration-none fw-semibold text-primary"
                  >
                    <span>View Complete Lease Terms</span>
                    <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className="p-4 text-center rounded-3"
                style={{
                  backgroundColor: 'var(--ll-surface-subtle)',
                  border: '1px dashed var(--ll-border)'
                }}
              >
                <i className="bi bi-file-earmark-x fs-3 d-block mb-1 text-muted"></i>
                <div className="fw-semibold text-dark">No active lease agreement on this unit</div>
                <small className="text-muted">This property is currently vacant and available for occupancy.</small>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary Column */}
        <div className="col-lg-4">
          {/* Financial Snapshot Card */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-cash-coin text-muted"></i>
              <span>Financial Snapshot</span>
            </div>

            <div className="mb-3">
              <span className="detail-spec-label d-block">Unit Operational Expenses</span>
              <div className="fw-bold fs-3 text-dark mt-1 tabular-nums">
                {formatINR(expenseSummary?.totalExpenses || 0)}
              </div>
              <small className="text-muted">
                {expenseSummary?.expenseCount || 0} operational expense {expenseSummary?.expenseCount === 1 ? 'record' : 'records'} logged
              </small>
            </div>

            <Link to="/expenses" className="btn-ll-secondary w-100 justify-content-center mt-2">
              <i className="bi bi-receipt" aria-hidden="true"></i>
              <span>View Operating Expenses</span>
            </Link>
          </div>

          {/* Quick Details Card */}
          <div className="card-saas">
            <div className="form-section-header">
              <i className="bi bi-info-circle text-muted"></i>
              <span>Unit Summary</span>
            </div>

            <div className="small text-muted d-flex flex-column gap-2">
              <div className="d-flex justify-content-between">
                <span>Occupancy Status:</span>
                <span className="fw-semibold text-dark">{property.status}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Building Type:</span>
                <span className="fw-semibold text-dark">{property.propertyType}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Parking:</span>
                <span className="fw-semibold text-dark">{property.parking ? 'Allocated' : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Property Listing?"
        message={`Are you sure you want to permanently delete '${property.title}'? Please ensure any active leases have been terminated first.`}
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

export default PropertyDetailPage;
