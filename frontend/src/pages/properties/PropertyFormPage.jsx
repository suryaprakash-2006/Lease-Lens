import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

const COMMON_AMENITIES = [
  'Gym',
  'Swimming Pool',
  'Elevator / Lift',
  '24x7 Power Backup',
  '24x7 Security & CCTV',
  'Clubhouse',
  'Covered Car Parking',
  'Children Play Area',
  'Jogging Track',
  'Visitor Parking',
  'Water Softener',
  'Gas Pipeline'
];

const PropertyFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    propertyType: 'Apartment',
    locality: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    bhk: 2,
    areaSqFt: 1100,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['24x7 Security & CCTV', 'Elevator / Lift'],
    description: '',
    listedRent: 30000,
    status: 'Available'
  });

  const [customAmenity, setCustomAmenity] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchProperty = async () => {
        try {
          const res = await propertiesAPI.getById(id);
          const prop = res?.data?.property;
          if (prop) {
            setFormData({
              title: prop.title || '',
              propertyType: prop.propertyType || 'Apartment',
              locality: prop.address?.locality || '',
              city: prop.address?.city || 'Bengaluru',
              state: prop.address?.state || 'Karnataka',
              pincode: prop.address?.pincode || '',
              bhk: prop.bhk || 2,
              areaSqFt: prop.areaSqFt || 1000,
              bedrooms: prop.bedrooms || 2,
              bathrooms: prop.bathrooms || 2,
              furnishingStatus: prop.furnishingStatus || 'Semi-Furnished',
              parking: Boolean(prop.parking),
              amenities: prop.amenities || [],
              description: prop.description || '',
              listedRent: prop.listedRent || 0,
              status: prop.status || 'Available'
            });
          }
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };
      fetchProperty();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const current = prev.amenities || [];
      if (current.includes(amenity)) {
        return { ...prev, amenities: current.filter((a) => a !== amenity) };
      } else {
        return { ...prev, amenities: [...current, amenity] };
      }
    });
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    if (customAmenity.trim()) {
      if (!formData.amenities.includes(customAmenity.trim())) {
        setFormData((prev) => ({
          ...prev,
          amenities: [...prev.amenities, customAmenity.trim()]
        }));
      }
      setCustomAmenity('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (!formData.title.trim()) {
      setError('Property title is required.');
      return;
    }
    if (!formData.locality.trim() || !formData.city.trim()) {
      setError('Both Locality and City are required.');
      return;
    }

    setSaving(true);
    const payload = {
      title: formData.title.trim(),
      propertyType: formData.propertyType,
      address: {
        locality: formData.locality.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim()
      },
      bhk: Number(formData.bhk),
      areaSqFt: Number(formData.areaSqFt),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      furnishingStatus: formData.furnishingStatus,
      parking: Boolean(formData.parking),
      amenities: formData.amenities,
      description: formData.description.trim(),
      listedRent: Number(formData.listedRent),
      status: formData.status
    };

    try {
      if (isEdit) {
        await propertiesAPI.update(id, payload);
        navigate(`/properties/${id}`);
      } else {
        const createRes = await propertiesAPI.create(payload);
        const newId = createRes?.data?._id;
        navigate(newId ? `/properties/${newId}` : '/properties');
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading property form..." />;

  return (
    <div className="property-form-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* PageHeader with Breadcrumb */}
      <PageHeader
        title={isEdit ? 'Edit Property Listing' : 'Add New Property Listing'}
        subtitle={
          isEdit
            ? `Updating listing details for '${formData.title || 'Property'}'`
            : 'Enter property specifications, location, amenities, and rental price'
        }
        breadcrumb={[
          { label: 'Properties', to: '/properties' },
          { label: isEdit ? 'Edit Listing' : 'New Listing' }
        ]}
      />

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit}>
        {/* Section 1: General Details */}
        <div className="card-saas mb-4">
          <div className="form-section-header">
            <i className="bi bi-card-heading text-muted"></i>
            <span>1. General Information</span>
          </div>

          <div className="mb-3">
            <label className="form-label-saas" htmlFor="propertyTitle">
              Property Title <span className="text-danger">*</span>
            </label>
            <input
              id="propertyTitle"
              type="text"
              name="title"
              className="form-control-saas"
              placeholder="e.g. Prestige Highline 2BHK Apartment"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="propertyType">
                Building / Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                className="form-select-saas"
                value={formData.propertyType}
                onChange={handleChange}
              >
                <option value="Apartment">Apartment</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Villa</option>
                <option value="Studio">Studio</option>
                <option value="Commercial">Commercial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="propertyStatus">
                Initial Occupancy Status
              </label>
              <select
                id="propertyStatus"
                name="status"
                className="form-select-saas"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Address & Location */}
        <div className="card-saas mb-4">
          <div className="form-section-header">
            <i className="bi bi-geo-alt text-muted"></i>
            <span>2. Location & Geographic Address</span>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="localityInput">
                Locality / Neighborhood <span className="text-danger">*</span>
              </label>
              <input
                id="localityInput"
                type="text"
                name="locality"
                className="form-control-saas"
                placeholder="e.g. Whitefield, Indiranagar"
                value={formData.locality}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="citySelect">
                City <span className="text-danger">*</span>
              </label>
              <select
                id="citySelect"
                name="city"
                className="form-select-saas"
                value={formData.city}
                onChange={handleChange}
                required
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="stateInput">
                State
              </label>
              <input
                id="stateInput"
                type="text"
                name="state"
                className="form-control-saas"
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="pincodeInput">
                Postal PIN Code
              </label>
              <input
                id="pincodeInput"
                type="text"
                name="pincode"
                className="form-control-saas"
                placeholder="e.g. 560066"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Configuration & Specs */}
        <div className="card-saas mb-4">
          <div className="form-section-header">
            <i className="bi bi-rulers text-muted"></i>
            <span>3. Unit Specifications & Architecture</span>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6 col-md-3">
              <label className="form-label-saas" htmlFor="bhkInput">
                BHK Rooms
              </label>
              <input
                id="bhkInput"
                type="number"
                name="bhk"
                min="1"
                max="10"
                className="form-control-saas tabular-nums"
                value={formData.bhk}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas" htmlFor="areaInput">
                Area (sq. ft.)
              </label>
              <input
                id="areaInput"
                type="number"
                name="areaSqFt"
                min="100"
                className="form-control-saas tabular-nums"
                value={formData.areaSqFt}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas" htmlFor="bedroomsInput">
                Bedrooms
              </label>
              <input
                id="bedroomsInput"
                type="number"
                name="bedrooms"
                min="1"
                className="form-control-saas tabular-nums"
                value={formData.bedrooms}
                onChange={handleChange}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas" htmlFor="bathroomsInput">
                Bathrooms
              </label>
              <input
                id="bathroomsInput"
                type="number"
                name="bathrooms"
                min="1"
                className="form-control-saas tabular-nums"
                value={formData.bathrooms}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label className="form-label-saas" htmlFor="furnishingStatus">
                Furnishing Status
              </label>
              <select
                id="furnishingStatus"
                name="furnishingStatus"
                className="form-select-saas"
                value={formData.furnishingStatus}
                onChange={handleChange}
              >
                <option value="Furnished">Fully Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            <div className="col-md-6 pt-md-4">
              <div className="form-check form-switch mt-2">
                <input
                  type="checkbox"
                  id="parkingCheck"
                  name="parking"
                  className="form-check-input"
                  checked={formData.parking}
                  onChange={handleChange}
                />
                <label className="form-check-label fw-semibold text-dark small" htmlFor="parkingCheck">
                  Dedicated Car Parking Available
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Amenities */}
        <div className="card-saas mb-4">
          <div className="form-section-header">
            <i className="bi bi-stars text-muted"></i>
            <span>4. Amenities & Facilities</span>
          </div>

          <p className="text-muted small mb-3">
            Select standard amenities available at this unit or add custom specifications below:
          </p>

          <div className="d-flex flex-wrap gap-2 mb-3">
            {COMMON_AMENITIES.map((amenity) => {
              const active = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  className={`chip-toggle ${active ? 'active' : ''}`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  <i className={`bi ${active ? 'bi-check-circle-fill' : 'bi-plus-circle'}`}></i>
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Amenity input */}
          <div className="row g-2 align-items-center">
            <div className="col-sm-8">
              <input
                type="text"
                className="form-control-saas"
                placeholder="Add custom amenity (e.g., EV Charging Port)"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity(e);
                  }
                }}
              />
            </div>
            <div className="col-sm-4">
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="btn-ll-secondary w-100 justify-content-center"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Amenity</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Financial Terms & Description */}
        <div className="card-saas mb-4">
          <div className="form-section-header">
            <i className="bi bi-currency-rupee text-muted"></i>
            <span>5. Financial Valuation & Remarks</span>
          </div>

          <div className="mb-3">
            <label className="form-label-saas" htmlFor="listedRentInput">
              Listed Monthly Rent (INR ₹) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">₹</span>
              <input
                id="listedRentInput"
                type="number"
                name="listedRent"
                min="0"
                step="500"
                className="form-control-saas border-start-0 tabular-nums"
                placeholder="30000"
                value={formData.listedRent}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-0">
            <label className="form-label-saas" htmlFor="descriptionInput">
              Listing Description / Landlord Notes
            </label>
            <textarea
              id="descriptionInput"
              name="description"
              className="form-control-saas"
              rows="3"
              placeholder="Highlight property USPs, nearby transit hubs, schools, or tenancy guidelines..."
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="d-flex align-items-center justify-content-between pt-2">
          <Link to={isEdit ? `/properties/${id}` : '/properties'} className="btn-ll-secondary">
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
                <span>Saving Listing...</span>
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" aria-hidden="true"></i>
                <span>{isEdit ? 'Update Property Listing' : 'Save Property Listing'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFormPage;
