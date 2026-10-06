import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

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
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <Link to="/properties" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-2 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Properties
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-bold mb-0">{property.title}</h3>
            <StatusBadge status={property.status} />
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/properties/${property._id}/edit`} className="btn-ll-secondary">
            <i className="bi bi-pencil"></i> Edit Property
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-outline-danger d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 fw-semibold"
          >
            <i className="bi bi-trash3"></i> Delete
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      <div className="row g-4">
        {/* Main Details */}
        <div className="col-lg-8">
          <div className="card-saas mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Property Specifications</h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small">Locality & City:</span>
                <div className="fw-bold fs-6 text-dark">{property.address?.locality}, {property.address?.city}</div>
                {property.address?.state && (
                  <small className="text-muted">{property.address.state} {property.address.pincode && `· ${property.address.pincode}`}</small>
                )}
              </div>

              <div className="col-sm-6">
                <span className="text-muted small">Configuration:</span>
                <div className="fw-semibold text-dark">{property.bhk} BHK {property.propertyType}</div>
                <small className="text-muted">{property.bedrooms} Bedrooms · {property.bathrooms} Bathrooms</small>
              </div>

              <div className="col-sm-6">
                <span className="text-muted small">Super Built-up Area:</span>
                <div className="fw-semibold text-dark">{property.areaSqFt} sq. ft.</div>
              </div>

              <div className="col-sm-6">
                <span className="text-muted small">Listed Rental Price:</span>
                <div className="fw-bold fs-5 text-primary">{formatINR(property.listedRent)} / month</div>
              </div>

              <div className="col-sm-6">
                <span className="text-muted small">Furnishing Status:</span>
                <div className="fw-semibold text-dark">{property.furnishingStatus}</div>
              </div>

              <div className="col-sm-6">
                <span className="text-muted small">Parking Allocation:</span>
                <div className="fw-semibold text-dark">{property.parking ? 'Dedicated Parking' : 'Street / None'}</div>
              </div>
            </div>

            {property.description && (
              <div className="mt-4 pt-3 border-top">
                <span className="text-muted small d-block mb-1">Description:</span>
                <p className="text-muted small mb-0">{property.description}</p>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <span className="text-muted small d-block mb-2">Amenities & Facilities:</span>
                <div className="d-flex flex-wrap gap-2">
                  {property.amenities.map((am, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-3 py-2">
                      <i className="bi bi-check2 me-1 text-success"></i> {am}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Lease Section */}
          <div className="card-saas">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 className="fw-bold mb-0">Active Lease Agreement</h5>
              {property.status === 'Available' && !activeLease && (
                <Link to="/leases/new" className="btn btn-sm btn-outline-primary fw-semibold">
                  <i className="bi bi-plus-lg"></i> Create Lease
                </Link>
              )}
            </div>

            {activeLease ? (
              <div className="p-3 bg-light rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold fs-6 text-dark">Tenant: {activeLease.tenant?.name}</div>
                  <StatusBadge status={activeLease.status} />
                </div>
                <div className="text-muted small mb-3">
                  Email: <strong>{activeLease.tenant?.email}</strong> · Phone: <strong>{activeLease.tenant?.phone}</strong>
                </div>
                <div className="row g-2 small">
                  <div className="col-6 col-sm-3">
                    <span className="text-muted">Agreed Rent:</span>
                    <div className="fw-bold text-dark">{formatINR(activeLease.monthlyRent)}/mo</div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted">Security Deposit:</span>
                    <div className="fw-bold text-dark">{formatINR(activeLease.securityDeposit)}</div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted">Start Date:</span>
                    <div className="text-dark">{formatDate(activeLease.startDate)}</div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-muted">End Date:</span>
                    <div className="text-dark">{formatDate(activeLease.endDate)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-top text-end">
                  <Link to={`/leases/${activeLease._id}`} className="btn btn-sm btn-link text-decoration-none fw-semibold">
                    View Complete Lease Terms <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted bg-light rounded-3">
                <i className="bi bi-file-earmark-x fs-3 d-block mb-1 text-muted"></i>
                <div className="fw-semibold">No active lease agreement on this unit</div>
                <small>This property is currently vacant and available for occupancy.</small>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="col-lg-4">
          <div className="card-saas mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Financial Snapshot</h5>
            <div className="mb-3">
              <span className="text-muted small">Total Unit Operating Expenses:</span>
              <div className="fw-bold fs-4 text-danger mt-1">
                {formatINR(expenseSummary?.totalExpenses || 0)}
              </div>
              <small className="text-muted">{expenseSummary?.expenseCount || 0} expense logs recorded</small>
            </div>
            <Link to="/expenses" className="btn btn-sm btn-outline-secondary w-100 mt-2">
              <i className="bi bi-cash-stack"></i> View Expenses
            </Link>
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
