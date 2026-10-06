import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

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
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/properties" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Properties
          </Link>
          <h3 className="fw-bold mb-0">{isEdit ? 'Edit Property Listing' : 'Add New Property Listing'}</h3>
        </div>
      </div>

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      <div className="card-saas p-4">
        <form onSubmit={handleSubmit}>
          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">1. General Information</h6>
          <div className="mb-3">
            <label className="form-label-saas">Property Title</label>
            <input
              type="text"
              name="title"
              className="form-control-saas"
              placeholder="e.g. Prestige Highline 2BHK Apartment"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label-saas">Property Type</label>
              <select
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
              <label className="form-label-saas">Occupancy Status</label>
              <select
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

          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">2. Location & Address</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label-saas">Locality / Neighborhood</label>
              <input
                type="text"
                name="locality"
                className="form-control-saas"
                placeholder="e.g. Koramangala 4th Block"
                value={formData.locality}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">City</label>
              <input
                type="text"
                name="city"
                className="form-control-saas"
                placeholder="e.g. Bengaluru"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">State</label>
              <input
                type="text"
                name="state"
                className="form-control-saas"
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-control-saas"
                placeholder="e.g. 560034"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">3. Unit Specifications & Rental Terms</h6>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <label className="form-label-saas">BHK</label>
              <input
                type="number"
                name="bhk"
                min="1"
                className="form-control-saas"
                value={formData.bhk}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas">Area (Sq. Ft.)</label>
              <input
                type="number"
                name="areaSqFt"
                min="50"
                className="form-control-saas"
                value={formData.areaSqFt}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas">Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                min="1"
                className="form-control-saas"
                value={formData.bedrooms}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label-saas">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                min="1"
                className="form-control-saas"
                value={formData.bathrooms}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Monthly Listed Rent (₹)</label>
              <input
                type="number"
                name="listedRent"
                min="0"
                className="form-control-saas"
                value={formData.listedRent}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Furnishing Status</label>
              <select
                name="furnishingStatus"
                className="form-select-saas"
                value={formData.furnishingStatus}
                onChange={handleChange}
              >
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            <div className="col-12">
              <div className="form-check mt-1">
                <input
                  type="checkbox"
                  id="parkingCheckbox"
                  name="parking"
                  className="form-check-input"
                  checked={formData.parking}
                  onChange={handleChange}
                />
                <label className="form-check-label fw-semibold text-dark" htmlFor="parkingCheckbox">
                  Dedicated Parking Space Included
                </label>
              </div>
            </div>
          </div>

          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">4. Amenities & Facilities</h6>
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-2 mb-3">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 ${
                      isSelected ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                  >
                    <i className={`bi ${isSelected ? 'bi-check2' : 'bi-plus'}`}></i>
                    {amenity}
                  </button>
                );
              })}
            </div>

            {/* Custom amenity addition */}
            <div className="input-group input-group-sm" style={{ maxWidth: '380px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add custom amenity..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="btn btn-outline-secondary"
              >
                Add
              </button>
            </div>
          </div>

          <div className="mb-4 pt-2">
            <label className="form-label-saas">Property Notes / Description (Optional)</label>
            <textarea
              name="description"
              rows="3"
              className="form-control-saas"
              placeholder="Highlight special features, nearby landmarks, or maintenance details..."
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <Link to="/properties" className="btn-ll-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-ll-primary">
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving Property...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  {isEdit ? 'Update Property' : 'Save Property Listing'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyFormPage;
