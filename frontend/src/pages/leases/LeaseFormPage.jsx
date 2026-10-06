import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { leasesAPI, propertiesAPI } from '../../services/api.js';
import { formatINR, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

const STANDARD_TERMS = [
  'No unauthorized subletting or commercial usage',
  'Maintenance payments due by the 5th of each calendar month',
  'Tenant responsible for internal repairs below ₹1,000',
  'Advance 30-day written notice required prior to vacating',
  'No structural modifications or painting without landlord consent'
];

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
    importantTerms: [STANDARD_TERMS[0], STANDARD_TERMS[1]],
    notes: ''
  });

  const [customTerm, setCustomTerm] = useState('');

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await propertiesAPI.getAll({ limit: 100 });
        const props = res?.data?.properties || [];
        setProperties(props);
        if (props.length > 0) {
          const firstProp = props[0];
          setFormData((prev) => ({
            ...prev,
            propertyId: firstProp._id,
            monthlyRent: firstProp.listedRent || 25000,
            securityDeposit: (firstProp.listedRent || 25000) * 2
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

  const toggleTerm = (term) => {
    setFormData((prev) => {
      const current = prev.importantTerms || [];
      if (current.includes(term)) {
        return { ...prev, importantTerms: current.filter((t) => t !== term) };
      } else {
        return { ...prev, importantTerms: [...current, term] };
      }
    });
  };

  const handleAddCustomTerm = (e) => {
    e.preventDefault();
    if (customTerm.trim()) {
      if (!formData.importantTerms.includes(customTerm.trim())) {
        setFormData((prev) => ({
          ...prev,
          importantTerms: [...prev.importantTerms, customTerm.trim()]
        }));
      }
      setCustomTerm('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (!formData.propertyId) {
      setError('Please select a property for this lease.');
      return;
    }

    if (!formData.tenantName.trim()) {
      setError('Tenant name is required.');
      return;
    }

    if (!formData.tenantEmail.trim()) {
      setError('Tenant email address is required.');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('Lease Start Date must be strictly before End Date.');
      return;
    }

    setSaving(true);
    const payload = {
      propertyId: formData.propertyId,
      tenant: {
        name: formData.tenantName.trim(),
        email: formData.tenantEmail.trim(),
        phone: formData.tenantPhone.trim(),
        occupantsCount: Number(formData.occupantsCount) || 1
      },
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      noticePeriodDays: Number(formData.noticePeriodDays) || 30,
      paymentDueDay: Number(formData.paymentDueDay) || 1,
      importantTerms: formData.importantTerms,
      notes: formData.notes.trim()
    };

    try {
      const res = await leasesAPI.create(payload);
      const newLeaseId = res?.data?._id;
      navigate(newLeaseId ? `/leases/${newLeaseId}` : '/leases');
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProps) return <LoadingSpinner message="Loading property units..." />;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
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
          <i className="bi bi-building-exclamation text-warning fs-1 mb-3 d-block"></i>
          <h5 className="fw-bold">No Properties Available</h5>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '400px' }}>
            You need to add at least one property listing before you can generate and assign a lease agreement.
          </p>
          <Link to="/properties/new" className="btn-ll-primary">
            <i className="bi bi-plus-lg"></i> Add Property First
          </Link>
        </div>
      ) : (
        <div className="card-saas p-4">
          <form onSubmit={handleSubmit}>
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">1. Select Property Unit</h6>
            <div className="mb-4">
              <label className="form-label-saas">Target Property Unit</label>
              <select
                name="propertyId"
                className="form-select-saas"
                value={formData.propertyId}
                onChange={handleChange}
                required
              >
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.address?.locality}, {p.address?.city}) — Listed: {formatINR(p.listedRent)}/mo [{p.status}]
                  </option>
                ))}
              </select>
            </div>

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">2. Tenant Information</h6>
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
                <label className="form-label-saas">Tenant Email Address</label>
                <input
                  type="email"
                  name="tenantEmail"
                  className="form-control-saas"
                  placeholder="rahul.sharma@example.com"
                  value={formData.tenantEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas">Tenant Phone Number</label>
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
                <label className="form-label-saas">Number of Occupants</label>
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

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">3. Financial Terms & Schedule</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label-saas">Agreed Monthly Rent (₹)</label>
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
                <label className="form-label-saas">Security Deposit Amount (₹)</label>
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
                <label className="form-label-saas">Lease Commencement (Start) Date</label>
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
                <label className="form-label-saas">Lease Expiration (End) Date</label>
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
                <label className="form-label-saas">Monthly Payment Due Day (1 to 31)</label>
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

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">4. Terms & Special Clauses</h6>
            <div className="mb-4">
              <div className="d-flex flex-column gap-2 mb-3">
                {STANDARD_TERMS.map((term) => {
                  const isChecked = formData.importantTerms.includes(term);
                  return (
                    <div key={term} className="form-check">
                      <input
                        type="checkbox"
                        id={`term-${term}`}
                        className="form-check-input"
                        checked={isChecked}
                        onChange={() => toggleTerm(term)}
                      />
                      <label className="form-check-label text-dark small" htmlFor={`term-${term}`}>
                        {term}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Custom clause input */}
              <div className="input-group input-group-sm" style={{ maxWidth: '440px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add custom clause..."
                  value={customTerm}
                  onChange={(e) => setCustomTerm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTerm}
                  className="btn btn-outline-secondary"
                >
                  Add Clause
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label-saas">Internal Notes (Optional)</label>
              <textarea
                name="notes"
                rows="2"
                className="form-control-saas"
                placeholder="Add private references, guarantor contacts, or meter readings..."
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Link to="/leases" className="btn-ll-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn-ll-primary">
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Generating Agreement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-plus"></i> Generate Lease Agreement
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
