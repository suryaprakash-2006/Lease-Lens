import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

const PropertyFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    propertyType: 'Apartment',
    locality: '',
    city: 'Bengaluru',
    state: '',
    pincode: '',
    bhk: 2,
    areaSqFt: 1000,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: false,
    listedRent: 25000,
    status: 'Available'
  });

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
              state: prop.address?.state || '',
              pincode: prop.address?.pincode || '',
              bhk: prop.bhk || 2,
              areaSqFt: prop.areaSqFt || 1000,
              bedrooms: prop.bedrooms || 2,
              bathrooms: prop.bathrooms || 2,
              furnishingStatus: prop.furnishingStatus || 'Semi-Furnished',
              parking: Boolean(prop.parking),
              listedRent: prop.listedRent || 0,
              status: prop.status || 'Available'
            });
          }
        } catch (err) {
          setError(err.message || 'Failed to load property.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setSaving(true);

    const payload = {
      title: formData.title,
      propertyType: formData.propertyType,
      address: {
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      },
      bhk: Number(formData.bhk),
      areaSqFt: Number(formData.areaSqFt),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      furnishingStatus: formData.furnishingStatus,
      parking: Boolean(formData.parking),
      listedRent: Number(formData.listedRent),
      status: formData.status
    };

    try {
      if (isEdit) {
        await propertiesAPI.update(id, payload);
      } else {
        await propertiesAPI.create(payload);
      }
      navigate('/properties');
    } catch (err) {
      setError(err.message || 'Failed to save property.');
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading property form..." />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/properties" className="btn btn-sm btn-link text-decoration-none p-0 text-muted mb-1 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Properties
          </Link>
          <h3 className="fw-bold mb-0">{isEdit ? 'Edit Property' : 'Add New Property'}</h3>
        </div>
      </div>

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      <div className="card-saas p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-saas">Property Title</label>
            <input
              type="text"
              name="title"
              className="form-control-saas"
              placeholder="e.g. Prestige Lakeview 2BHK"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-3 mb-3">
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
              <label className="form-label-saas">Listing Status</label>
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

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label-saas">Locality / Neighborhood</label>
              <input
                type="text"
                name="locality"
                className="form-control-saas"
                placeholder="e.g. Indiranagar"
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
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-3">
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

            <div className="col-md-3">
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

            <div className="col-md-3">
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

            <div className="col-md-3">
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
          </div>

          <div className="row g-3 mb-4">
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
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input
                type="checkbox"
                id="parkingCheck"
                name="parking"
                className="form-check-input"
                checked={formData.parking}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="parkingCheck">
                Dedicated Parking Space Available
              </label>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <Link to="/properties" className="btn-ll-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-ll-primary">
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  {isEdit ? 'Update Property' : 'Create Property'}
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
