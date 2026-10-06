import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await propertiesAPI.getById(id);
        setData(response?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <LoadingSpinner message="Fetching property details..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!data?.property) return <div className="text-center p-5 text-muted">Property not found.</div>;

  const { property, activeLease, expenseSummary } = data;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
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
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details */}
        <div className="col-lg-8">
          <div className="card-saas mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Property Overview</h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small">Location:</span>
                <div className="fw-semibold">{property.address?.locality}, {property.address?.city}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Property Type:</span>
                <div className="fw-semibold">{property.bhk} BHK {property.propertyType}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Super Built-up Area:</span>
                <div className="fw-semibold">{property.areaSqFt} sq. ft.</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Listed Rent:</span>
                <div className="fw-bold fs-5 text-primary">₹{property.listedRent?.toLocaleString('en-IN')} / mo</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Furnishing:</span>
                <div className="fw-semibold">{property.furnishingStatus}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Bedrooms / Bathrooms:</span>
                <div className="fw-semibold">{property.bedrooms} Bed · {property.bathrooms} Bath</div>
              </div>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4">
                <span className="text-muted small d-block mb-2">Amenities:</span>
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
            <h5 className="fw-bold mb-3 border-bottom pb-2">Active Lease Agreement</h5>
            {activeLease ? (
              <div className="p-3 bg-light rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold fs-6">Tenant: {activeLease.tenant?.name}</div>
                  <StatusBadge status={activeLease.status} />
                </div>
                <div className="text-muted small mb-3">
                  Email: {activeLease.tenant?.email} · Phone: {activeLease.tenant?.phone}
                </div>
                <div className="row g-2 small">
                  <div className="col-6">
                    <span className="text-muted">Agreed Rent:</span>
                    <div className="fw-bold">₹{activeLease.monthlyRent?.toLocaleString('en-IN')}/mo</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Security Deposit:</span>
                    <div className="fw-bold">₹{activeLease.securityDeposit?.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Start Date:</span>
                    <div>{new Date(activeLease.startDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">End Date:</span>
                    <div>{new Date(activeLease.endDate).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted bg-light rounded-3">
                <i className="bi bi-file-earmark-x fs-3 d-block mb-1"></i>
                No active lease on this property.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div className="col-lg-4">
          <div className="card-saas">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Financial Insights</h5>
            <div className="mb-3">
              <span className="text-muted small">Total Operating Expenses:</span>
              <div className="fw-bold fs-4 text-danger mt-1">
                ₹{(expenseSummary?.totalExpenses || 0).toLocaleString('en-IN')}
              </div>
              <small className="text-muted">{expenseSummary?.expenseCount || 0} expense logs recorded</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
