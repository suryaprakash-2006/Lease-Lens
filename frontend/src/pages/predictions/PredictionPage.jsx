import React, { useState, useRef, useEffect } from 'react';
import { predictAPI } from '../../services/api.js';
import { formatINR, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

import { METRO_REGIONS, ALL_LOCATIONS, DEFAULT_LOCATION } from './metroRegions.js';

const FURNISHING_STATUSES = [
  { value: 'Semi-Furnished', label: 'Semi-Furnished' },
  { value: 'Furnished', label: 'Fully Furnished' },
  { value: 'Unfurnished', label: 'Unfurnished' }
];

const TENANT_PREFERENCES = [
  { value: 'Bachelors/Family', label: 'Bachelors & Family' },
  { value: 'Family', label: 'Family Only' },
  { value: 'Bachelors', label: 'Bachelors Only' }
];

const AREA_TYPES = [
  { value: 'Super Area', label: 'Super Area' },
  { value: 'Carpet Area', label: 'Carpet Area' },
  { value: 'Built Area', label: 'Built Area' }
];

const FLOOR_PRESETS = [
  'Ground out of 2',
  '1 out of 3',
  '2 out of 4',
  '3 out of 5',
  '5 out of 10'
];

const SAMPLE_PRESETS = [
  {
    name: '2 BHK Whitefield',
    description: 'Semi-furnished 1,100 sq ft apartment in Whitefield (Bengaluru Urban)',
    locationId: 'blr-whitefield',
    data: {
      BHK: 2,
      Size: 1100,
      Bathroom: 2,
      Floor: '2 out of 4',
      Furnishing_Status: 'Semi-Furnished',
      Tenant_Preferred: 'Family',
      Area_Type: 'Super Area'
    }
  },
  {
    name: '1 BHK Navi Mumbai',
    description: 'Furnished 550 sq ft apartment in Navi Mumbai (MMR)',
    locationId: 'mumbai-navi-mumbai',
    data: {
      BHK: 1,
      Size: 550,
      Bathroom: 1,
      Floor: '4 out of 10',
      Furnishing_Status: 'Furnished',
      Tenant_Preferred: 'Bachelors',
      Area_Type: 'Carpet Area'
    }
  },
  {
    name: '3 BHK Gurugram',
    description: 'Furnished 1,800 sq ft spacious home in Gurugram (Delhi NCR)',
    locationId: 'delhi-gurugram',
    data: {
      BHK: 3,
      Size: 1800,
      Bathroom: 3,
      Floor: '1 out of 4',
      Furnishing_Status: 'Furnished',
      Tenant_Preferred: 'Family',
      Area_Type: 'Super Area'
    }
  },
  {
    name: '2 BHK Gachibowli',
    description: 'Semi-furnished 1,200 sq ft apartment in Gachibowli (Greater Hyderabad)',
    locationId: 'hyd-gachibowli',
    data: {
      BHK: 2,
      Size: 1200,
      Bathroom: 2,
      Floor: '3 out of 5',
      Furnishing_Status: 'Semi-Furnished',
      Tenant_Preferred: 'Bachelors/Family',
      Area_Type: 'Super Area'
    }
  }
];

const INITIAL_FORM = {
  BHK: 2,
  Size: 1000,
  Bathroom: 2,
  Floor: '2 out of 4',
  Furnishing_Status: 'Semi-Furnished',
  Tenant_Preferred: 'Bachelors/Family',
  Area_Type: 'Super Area'
};

const PredictionPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleApplyPreset = (preset) => {
    const matchedLoc = ALL_LOCATIONS.find((l) => l.id === preset.locationId) || DEFAULT_LOCATION;
    setSelectedLocation(matchedLoc);
    setFormData({ ...preset.data });
    setError(null);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setSelectedLocation(DEFAULT_LOCATION);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setResult(null);
    setError(null);
    setLastSubmitted(null);
  };

  // Filter grouped regions by search query
  const filteredGroups = METRO_REGIONS.map((group) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return group;

    const groupMatches = group.region.toLowerCase().includes(query) || group.anchorCity.toLowerCase().includes(query);
    const matchingLocations = group.locations.filter((loc) =>
      groupMatches || loc.name.toLowerCase().includes(query)
    );

    return {
      ...group,
      locations: matchingLocations
    };
  }).filter((group) => group.locations.length > 0);

  const totalFilteredCount = filteredGroups.reduce((acc, g) => acc + g.locations.length, 0);
  const flatFilteredLocations = filteredGroups.flatMap((group) => group.locations);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!formData.Floor || !formData.Floor.trim()) {
      setError('Floor description is required (e.g., "2 out of 4" or "Ground").');
      return;
    }

    if (formData.Size <= 0) {
      setError('Property size must be a positive number in square feet.');
      return;
    }

    setLoading(true);

    // Map the selected satellite locality to its trained anchor city
    const canonicalCity = selectedLocation.anchorCity;

    const payload = {
      BHK: Number(formData.BHK),
      Size: Number(formData.Size),
      Bathroom: Number(formData.Bathroom),
      Floor: String(formData.Floor).trim(),
      City: canonicalCity,
      Furnishing_Status: formData.Furnishing_Status,
      Tenant_Preferred: formData.Tenant_Preferred,
      Area_Type: formData.Area_Type
    };

    try {
      const response = await predictAPI.predict(payload);
      const predictedRent = response?.predicted_rent_inr ?? response?.data?.predicted_rent_inr;
      if (predictedRent !== undefined && predictedRent !== null) {
        setResult(Number(predictedRent));
        setLastSubmitted({
          ...payload,
          locationName: selectedLocation.name,
          region: selectedLocation.region,
          anchorCity: canonicalCity
        });
      } else {
        throw new Error('Prediction service did not return an estimate.');
      }
    } catch (err) {
      console.error('Rent prediction error:', err);
      if (err.statusCode === 502) {
        setError('FastAPI inference engine is unreachable. Please ensure the ML service is running on port 8000.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="AI Rent Prediction Engine"
        subtitle="Estimate residential rental market rates across 25 metropolitan localities in 6 key urban zones."
        badge={
          <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-cpu me-1 text-primary"></i> ML Inference Engine
          </span>
        }
        actions={
          <button
            type="button"
            className="btn-ll-secondary"
            onClick={handleReset}
          >
            <i className="bi bi-arrow-counterclockwise"></i> Reset Form
          </button>
        }
      />

      {/* Preset Quick Fill Pills */}
      <div className="card-saas p-3 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="small fw-bold text-muted d-flex align-items-center gap-1 me-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
            <i className="bi bi-lightning-charge text-primary"></i> Quick Comps:
          </span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="btn btn-sm btn-outline-secondary bg-white text-dark py-1 px-2 border"
              style={{ fontSize: '0.8rem', borderRadius: '6px' }}
              onClick={() => handleApplyPreset(preset)}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="row g-4">
        {/* Input Form Column */}
        <div className={result !== null ? 'col-lg-7' : 'col-12'}>
          <div className="card-saas p-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-sliders text-primary"></i> Listing Parameters
            </h5>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Searchable Metropolitan Locality Dropdown (Option A) */}
                <div className="col-12" ref={dropdownRef} style={{ position: 'relative' }}>
                  <label htmlFor="locality-select" className="form-label-saas d-flex justify-content-between">
                    <span>
                      Metropolitan Location <span className="text-danger">*</span>
                    </span>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Anchor: <strong>{selectedLocation.anchorCity}</strong> ({selectedLocation.region})
                    </span>
                  </label>

                  {/* Dropdown Trigger Box */}
                  <button
                    ref={triggerRef}
                    id="locality-select"
                    type="button"
                    className="form-select-saas text-start d-flex justify-content-between align-items-center bg-white"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsDropdownOpen(true);
                      }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                  >
                    <span className="d-flex align-items-center gap-2 text-truncate">
                      <i className="bi bi-geo-alt text-primary"></i>
                      <strong className="text-dark">{selectedLocation.name}</strong>
                      <span className="badge bg-light text-muted border px-2 py-1">
                        {selectedLocation.region}
                      </span>
                    </span>
                    <i className={`bi ${isDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                  </button>

                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Select from 25 satellite towns and suburban hubs across 6 trained metropolitan regions.
                  </small>

                  {/* Searchable Floating Popover Menu */}
                  {isDropdownOpen && (
                    <div
                      className="card-saas p-2 shadow-lg"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1050,
                        maxHeight: '340px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        marginTop: '4px'
                      }}
                      role="listbox"
                    >
                      {/* Search Input Box */}
                      <div className="p-1 mb-2 border-bottom">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            ref={searchInputRef}
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Type to filter e.g. Gurugram, Whitefield, Thane, OMR..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (flatFilteredLocations.length > 0) {
                                  itemRefs.current[0]?.focus();
                                }
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setIsDropdownOpen(false);
                                triggerRef.current?.focus();
                              } else if (e.key === 'Enter') {
                                if (flatFilteredLocations.length > 0) {
                                  e.preventDefault();
                                  handleSelectLocation(flatFilteredLocations[0]);
                                  triggerRef.current?.focus();
                                }
                              }
                            }}
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary border"
                              onClick={() => setSearchQuery('')}
                              title="Clear search"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grouped Location List */}
                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: '250px' }}>
                        {totalFilteredCount === 0 ? (
                          <div className="text-center py-4 text-muted small">
                            <i className="bi bi-geo-alt-slash fs-4 d-block mb-1"></i>
                            No location matching &ldquo;{searchQuery}&rdquo;.
                          </div>
                        ) : (
                          (() => {
                            let runningItemIndex = 0;
                            return filteredGroups.map((group) => (
                              <div key={group.region} className="mb-2">
                                {/* Region Header */}
                                <div
                                  className="px-2 py-1 bg-light rounded text-uppercase text-muted fw-bold d-flex justify-content-between align-items-center"
                                  style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}
                                >
                                  <span>{group.region}</span>
                                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
                                    Anchor: {group.anchorCity}
                                  </span>
                                </div>

                                {/* Locations within region */}
                                <div className="mt-1 d-flex flex-column gap-1">
                                  {group.locations.map((loc) => {
                                    const isSelected = selectedLocation.id === loc.id;
                                    const currentItemIndex = runningItemIndex++;
                                    return (
                                      <button
                                        key={loc.id}
                                        ref={(el) => {
                                          itemRefs.current[currentItemIndex] = el;
                                        }}
                                        type="button"
                                        className={`btn btn-sm text-start py-1 px-2 d-flex justify-content-between align-items-center rounded-2 ${
                                          isSelected
                                            ? 'btn-primary text-white fw-semibold'
                                            : 'btn-light text-dark bg-transparent'
                                        }`}
                                        onClick={() => {
                                          handleSelectLocation(loc);
                                          triggerRef.current?.focus();
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            if (currentItemIndex < flatFilteredLocations.length - 1) {
                                              itemRefs.current[currentItemIndex + 1]?.focus();
                                            }
                                          } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            if (currentItemIndex > 0) {
                                              itemRefs.current[currentItemIndex - 1]?.focus();
                                            } else {
                                              searchInputRef.current?.focus();
                                            }
                                          } else if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSelectLocation(loc);
                                            triggerRef.current?.focus();
                                          } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            triggerRef.current?.focus();
                                          }
                                        }}
                                        style={{ fontSize: '0.875rem' }}
                                      >
                                        <span>{loc.name}</span>
                                        {isSelected && <i className="bi bi-check2 fw-bold"></i>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BHK */}
                <div className="col-md-6">
                  <label htmlFor="bhk" className="form-label-saas">
                    BHK (Bedrooms) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bhk"
                    type="number"
                    name="BHK"
                    min="0"
                    max="10"
                    className="form-control-saas"
                    value={formData.BHK}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Property Size (sq ft) */}
                <div className="col-md-6">
                  <label htmlFor="size" className="form-label-saas">
                    Property Size (Sq Ft) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="size"
                    type="number"
                    name="Size"
                    min="50"
                    max="50000"
                    step="10"
                    className="form-control-saas"
                    placeholder="e.g., 1000"
                    value={formData.Size}
                    onChange={handleChange}
                    required
                  />
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Residential carpet/built area
                  </small>
                </div>

                {/* Bathrooms */}
                <div className="col-md-6">
                  <label htmlFor="bathroom" className="form-label-saas">
                    Bathrooms <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bathroom"
                    type="number"
                    name="Bathroom"
                    min="0"
                    max="10"
                    className="form-control-saas"
                    value={formData.Bathroom}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Floor */}
                <div className="col-md-6">
                  <label htmlFor="floor" className="form-label-saas">
                    Floor Level <span className="text-danger">*</span>
                  </label>
                  <input
                    id="floor"
                    type="text"
                    name="Floor"
                    className="form-control-saas"
                    placeholder="e.g., 2 out of 4 or Ground"
                    value={formData.Floor}
                    onChange={handleChange}
                    required
                  />
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {FLOOR_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="badge bg-light text-muted border text-decoration-none py-1 px-2"
                        style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                        onClick={() => setFormData((prev) => ({ ...prev, Floor: p }))}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area Type */}
                <div className="col-md-6">
                  <label htmlFor="areaType" className="form-label-saas">
                    Area Type <span className="text-danger">*</span>
                  </label>
                  <select
                    id="areaType"
                    name="Area_Type"
                    className="form-select-saas"
                    value={formData.Area_Type}
                    onChange={handleChange}
                    required
                  >
                    {AREA_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Furnishing Status */}
                <div className="col-md-6">
                  <label htmlFor="furnishingStatus" className="form-label-saas">
                    Furnishing Status <span className="text-danger">*</span>
                  </label>
                  <select
                    id="furnishingStatus"
                    name="Furnishing_Status"
                    className="form-select-saas"
                    value={formData.Furnishing_Status}
                    onChange={handleChange}
                    required
                  >
                    {FURNISHING_STATUSES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant Preference */}
                <div className="col-md-6">
                  <label htmlFor="tenantPreferred" className="form-label-saas">
                    Tenant Preference <span className="text-danger">*</span>
                  </label>
                  <select
                    id="tenantPreferred"
                    name="Tenant_Preferred"
                    className="form-select-saas"
                    value={formData.Tenant_Preferred}
                    onChange={handleChange}
                    required
                  >
                    {TENANT_PREFERENCES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
                <button
                  type="submit"
                  className="btn-ll-primary px-4 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Estimating Rent...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lightning-charge"></i> Calculate Estimate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Prediction Output Column */}
        {result !== null && (
          <div className="col-lg-5">
            <div className="card-saas p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <span className="badge bg-light text-primary border fw-bold text-uppercase px-2 py-1" style={{ fontSize: '0.725rem' }}>
                    <i className="bi bi-cpu me-1"></i> ML Model Valuation
                  </span>
                  <span className="text-muted small">
                    <i className="bi bi-clock me-1"></i> Just now
                  </span>
                </div>

                <div className="text-center py-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--ll-surface-subtle)', border: '1px solid var(--ll-border)' }}>
                  <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    Estimated Monthly Rent
                  </div>
                  <div className="display-6 fw-bold text-primary mb-1 tabular-nums">
                    {formatINR(Math.round(result))}
                  </div>
                  <div className="text-muted small">
                    per month (INR)
                  </div>
                </div>

                {/* Metropolitan Comp Accuracy Disclosure */}
                {lastSubmitted && (
                  <div
                    className="alert alert-info py-2 px-3 mb-3 border-0 bg-info-subtle text-info-emphasis d-flex align-items-start gap-2"
                    style={{ fontSize: '0.78rem', lineHeight: '1.45', borderRadius: '8px' }}
                  >
                    <i className="bi bi-geo-alt-fill text-info mt-1 fs-6"></i>
                    <div>
                      <strong>Metropolitan Comp Disclosure:</strong> Valuation for{' '}
                      <strong>{lastSubmitted.locationName}</strong> is modeled on benchmark transactions
                      from its parent metropolitan region (
                      <strong>{lastSubmitted.region}</strong> &rarr; anchor{' '}
                      <strong>{lastSubmitted.anchorCity}</strong>). The statistical model predicts broader urban market
                      levels and does not reflect street-specific micro-market premiums.
                    </div>
                  </div>
                )}

                <div className="card-saas p-3 mb-3 bg-white">
                  <h6 className="fw-bold mb-2 small text-uppercase text-muted">
                    Projected Annual Yield
                  </h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Annual Gross Rent:</span>
                    <span className="fw-bold text-dark tabular-nums">{formatINR(Math.round(result * 12))}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="text-muted small">Estimated Range (&plusmn;10%):</span>
                    <span className="text-muted small tabular-nums">
                      {formatINR(Math.round(result * 0.9))} &ndash; {formatINR(Math.round(result * 1.1))}
                    </span>
                  </div>
                </div>

                {lastSubmitted && (
                  <div className="card-saas p-3 bg-white">
                    <h6 className="fw-bold mb-2 small text-uppercase text-muted">
                      Comps & Parameters Summary
                    </h6>
                    <div className="row g-2 small">
                      <div className="col-12 border-bottom pb-1 mb-1">
                        <span className="text-muted">Selected Location:</span>{' '}
                        <strong className="text-dark">{lastSubmitted.locationName}</strong>{' '}
                        <span className="badge bg-light text-muted border ms-1">{lastSubmitted.region}</span>
                        <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                          (Anchor: {lastSubmitted.anchorCity})
                        </span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">BHK:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.BHK} BHK</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Size:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.Size} sq ft</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Floor:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.Floor}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Bathrooms:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.Bathroom}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Furnishing:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.Furnishing_Status}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Tenant:</span>{' '}
                        <span className="fw-semibold">{lastSubmitted.Tenant_Preferred}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-shield-check me-1 text-success"></i>
                Valuation computed via Gradient Boosting Regressor across verified metropolitan comps.
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <LoadingSpinner message="Querying ML inference pipeline..." />}
    </div>
  );
};

export default PredictionPage;
