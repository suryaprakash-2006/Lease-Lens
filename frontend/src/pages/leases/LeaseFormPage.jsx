import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { leasesAPI, propertiesAPI } from '../../services/api.js';
import { formatINR, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

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
    <div className="lease-form-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* PageHeader with Breadcrumb */}
      <PageHeader
        title="Create Lease Agreement"
        subtitle="Generate a legally binding residential lease contract for an assigned property unit"
        breadcrumb={[
          { label: 'Lease Agreements', to: '/leases' },
          { label: 'New Agreement' }
        ]}
      />

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      {properties.length === 0 ? (
        <div className="card-saas text-center p-5">
          <div className="empty-state-icon mb-3">
            <i className="bi bi-building-exclamation text-warning fs-2"></i>
          </div>
          <h5 className="fw-bold mb-2 text-dark" style={{ fontFamily: 'var(--ll-heading-font)' }}>
            No Properties Available
          </h5>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '420px', lineHeight: '1.5' }}>
            You need to add at least one property listing before you can generate and assign a tenancy lease agreement.
          </p>
          <Link to="/properties/new" className="btn-ll-primary">
            <i className="bi bi-plus-lg"></i>
            <span>Add Property First</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Section 1: Property Selection */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-building text-muted"></i>
              <span>1. Target Property Unit</span>
            </div>

            <div className="mb-0">
              <label className="form-label-saas" htmlFor="propertySelect">
                Select Property Unit <span className="text-danger">*</span>
              </label>
              <select
                id="propertySelect"
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
          </div>

          {/* Section 2: Tenant Profile */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-person text-muted"></i>
              <span>2. Tenant Information</span>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="tenantNameInput">
                  Tenant Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="tenantNameInput"
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
                <label className="form-label-saas" htmlFor="tenantEmailInput">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  id="tenantEmailInput"
                  type="email"
                  name="tenantEmail"
                  className="form-control-saas"
                  placeholder="rahul.sharma@example.com"
                  value={formData.tenantEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="tenantPhoneInput">
                  Phone / Mobile Number
                </label>
                <input
                  id="tenantPhoneInput"
                  type="text"
                  name="tenantPhone"
                  className="form-control-saas"
                  placeholder="+91 9876543210"
                  value={formData.tenantPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="occupantsInput">
                  Number of Occupants
                </label>
                <input
                  id="occupantsInput"
                  type="number"
                  name="occupantsCount"
                  min="1"
                  max="20"
                  className="form-control-saas tabular-nums"
                  value={formData.occupantsCount}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Terms & Timeline */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-currency-rupee text-muted"></i>
              <span>3. Financial Terms & Schedule</span>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="monthlyRentInput">
                  Agreed Monthly Rent (INR ₹) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted border-end-0">₹</span>
                  <input
                    id="monthlyRentInput"
                    type="number"
                    name="monthlyRent"
                    min="0"
                    step="500"
                    className="form-control-saas border-start-0 tabular-nums"
                    placeholder="25000"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="securityDepositInput">
                  Security Deposit (INR ₹) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted border-end-0">₹</span>
                  <input
                    id="securityDepositInput"
                    type="number"
                    name="securityDeposit"
                    min="0"
                    step="1000"
                    className="form-control-saas border-start-0 tabular-nums"
                    placeholder="50000"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="startDateInput">
                  Lease Start Date <span className="text-danger">*</span>
                </label>
                <input
                  id="startDateInput"
                  type="date"
                  name="startDate"
                  className="form-control-saas"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="endDateInput">
                  Lease End Date <span className="text-danger">*</span>
                </label>
                <input
                  id="endDateInput"
                  type="date"
                  name="endDate"
                  className="form-control-saas"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="paymentDueDayInput">
                  Monthly Rent Due Day
                </label>
                <select
                  id="paymentDueDayInput"
                  name="paymentDueDay"
                  className="form-select-saas"
                  value={formData.paymentDueDay}
                  onChange={handleChange}
                >
                  <option value="1">1st of each month</option>
                  <option value="5">5th of each month</option>
                  <option value="10">10th of each month</option>
                  <option value="15">15th of each month</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label-saas" htmlFor="noticePeriodInput">
                  Notice Period (Days)
                </label>
                <input
                  id="noticePeriodInput"
                  type="number"
                  name="noticePeriodDays"
                  min="0"
                  max="180"
                  className="form-control-saas tabular-nums"
                  value={formData.noticePeriodDays}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clauses & Notes */}
          <div className="card-saas mb-4">
            <div className="form-section-header">
              <i className="bi bi-file-earmark-check text-muted"></i>
              <span>4. Agreement Clauses & Notes</span>
            </div>

            <p className="text-muted small mb-3">
              Select key agreement clauses or add custom terms:
            </p>

            <div className="d-flex flex-column gap-2 mb-3">
              {STANDARD_TERMS.map((term) => {
                const active = formData.importantTerms.includes(term);
                return (
                  <button
                    type="button"
                    key={term}
                    className={`chip-toggle text-start py-2 px-3 ${active ? 'active' : ''}`}
                    onClick={() => toggleTerm(term)}
                  >
                    <i className={`bi ${active ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                    <span>{term}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom clause input */}
            <div className="row g-2 align-items-center mb-4">
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control-saas"
                  placeholder="Add custom clause (e.g. Pets allowed with deposit)"
                  value={customTerm}
                  onChange={(e) => setCustomTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTerm(e);
                    }
                  }}
                />
              </div>
              <div className="col-sm-4">
                <button
                  type="button"
                  onClick={handleAddCustomTerm}
                  className="btn-ll-secondary w-100 justify-content-center"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add Clause</span>
                </button>
              </div>
            </div>

            <div className="mb-0">
              <label className="form-label-saas" htmlFor="notesTextarea">
                Internal Management Notes (Optional)
              </label>
              <textarea
                id="notesTextarea"
                name="notes"
                className="form-control-saas"
                rows="3"
                placeholder="Private notes on background verification, guarantor details, or special requests..."
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="d-flex align-items-center justify-content-between pt-2">
            <Link to="/leases" className="btn-ll-secondary">
              <i className="bi bi-x-lg"></i>
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              className="btn-ll-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Generating Agreement...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg" aria-hidden="true"></i>
                  <span>Create Lease Agreement</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LeaseFormPage;
