import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { leasesAPI, propertiesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

const LeaseFormPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    propertyId: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    occupantsCount: 1,
    monthlyRent: '',
    securityDeposit: '',
    startDate: todayStr,
    endDate: nextYearStr,
    noticePeriodDays: 30,
    paymentDueDay: 1,
    notes: ''
  });

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await propertiesAPI.getAll({ limit: 100 });
        const props = res?.data?.properties || [];
        setProperties(props);
        if (props.length > 0) {
          setFormData((prev) => ({
            ...prev,
            propertyId: props[0]._id,
            monthlyRent: props[0].listedRent || 25000,
            securityDeposit: (props[0].listedRent || 25000) * 2
          }));
        }
      } catch (err) {
        console.error('[LeaseForm] Error fetching properties:', err);
      } finally {
        setLoadingProps(false);
      }
    };
    fetchProps();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextState = { ...prev, [name]: value };
      if (name === 'propertyId') {
        const selected = properties.find((p) => p._id === value);
        if (selected) {
          nextState.monthlyRent = selected.listedRent || prev.monthlyRent;
          nextState.securityDeposit = (selected.listedRent || prev.monthlyRent) * 2;
        }
      }
      return nextState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (!formData.propertyId) {
      setError('Please select a property for this lease.');
      return;
    }

    setSaving(true);
    const payload = {
      propertyId: formData.propertyId,
      tenant: {
        name: formData.tenantName,
        email: formData.tenantEmail,
        phone: formData.tenantPhone,
        occupantsCount: Number(formData.occupantsCount)
      },
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      noticePeriodDays: Number(formData.noticePeriodDays),
      paymentDueDay: Number(formData.paymentDueDay),
      notes: formData.notes
    };

    try {
      await leasesAPI.create(payload);
      navigate('/leases');
    } catch (err) {
      setError(err.message || 'Failed to create lease agreement.');
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProps) return <LoadingSpinner message="Loading properties..." />;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/leases" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Leases
          </Link>
          <h3 className="fw-bold mb-0">Create Lease Agreement</h3>
        </div>
      </div>

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      {properties.length === 0 ? (
        <div className="card-saas text-center p-5">
          <i className="bi bi-building-exclamation text-warning fs-2 mb-2 d-block"></i>
          <h5>No Properties Available</h5>
          <p className="text-muted small">You need to add a property before creating a lease agreement.</p>
          <Link to="/properties/new" className="btn-ll-primary mt-2">
            <i className="bi bi-plus-lg"></i> Add Property First
          </Link>
        </div>
      ) : (
        <div className="card-saas p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label-saas">Select Property</label>
              <select
                name="propertyId"
                className="form-select-saas"
                value={formData.propertyId}
                onChange={handleChange}
                required
              >
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.address?.locality}, {p.address?.city}) — ₹{p.listedRent?.toLocaleString('en-IN')}/mo
                  </option>
                ))}
              </select>
            </div>

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Tenant Information</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label-saas">Tenant Full Name</label>
                <input
                  type="text"
                  name="tenantName"
                  className="form-control-saas"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.tenantName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Tenant Email</label>
                <input
                  type="email"
                  name="tenantEmail"
                  className="form-control-saas"
                  placeholder="rahul@example.com"
                  value={formData.tenantEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Tenant Phone</label>
                <input
                  type="tel"
                  name="tenantPhone"
                  className="form-control-saas"
                  placeholder="+91 98765 43210"
                  value={formData.tenantPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Occupants Count</label>
                <input
                  type="number"
                  name="occupantsCount"
                  min="1"
                  className="form-control-saas"
                  value={formData.occupantsCount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Lease Terms & Schedule</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label-saas">Monthly Rent (₹)</label>
                <input
                  type="number"
                  name="monthlyRent"
                  min="0"
                  className="form-control-saas"
                  value={formData.monthlyRent}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Security Deposit (₹)</label>
                <input
                  type="number"
                  name="securityDeposit"
                  min="0"
                  className="form-control-saas"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-control-saas"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-control-saas"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Notice Period (Days)</label>
                <input
                  type="number"
                  name="noticePeriodDays"
                  min="0"
                  className="form-control-saas"
                  value={formData.noticePeriodDays}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Rent Due Day (1-31)</label>
                <input
                  type="number"
                  name="paymentDueDay"
                  min="1"
                  max="31"
                  className="form-control-saas"
                  value={formData.paymentDueDay}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Link to="/leases" className="btn-ll-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn-ll-primary">
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating Agreement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-plus"></i> Create Lease
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LeaseFormPage;
