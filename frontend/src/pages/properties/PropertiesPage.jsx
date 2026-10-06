import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { propertiesAPI } from '../../services/api.js';
import { formatINR, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [bhk, setBhk] = useState('');
  const [status, setStatus] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [furnishingStatus, setFurnishingStatus] = useState('');

  // Delete modal state
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertiesAPI.getAll({
        search,
        city,
        bhk,
        status,
        propertyType,
        furnishingStatus
      });
      setProperties(response?.data?.properties || []);
    } catch (err) {
      console.error('[Properties] Error fetching property portfolio:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, city, bhk, status, propertyType, furnishingStatus]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDeleteConfirm = async () => {
    if (!deletingProperty) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await propertiesAPI.delete(deletingProperty._id);
      setDeletingProperty(null);
      fetchProperties();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeletingProperty(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCity('');
    setBhk('');
    setStatus('');
    setPropertyType('');
    setFurnishingStatus('');
  };

  const hasActiveFilters = Boolean(
    search || city || bhk || status || propertyType || furnishingStatus
  );

  return (
    <div>
      {/* Header bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Properties Portfolio</h3>
          <p className="text-muted small mb-0">
            Manage your real estate listings, unit configurations, and occupancy statuses
          </p>
        </div>
        <div>
          <Link to="/properties/new" className="btn-ll-primary">
            <i className="bi bi-plus-lg"></i> Add New Property
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card-saas mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control-saas border-start-0"
                placeholder="Search title, locality, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select-saas"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">All Cities</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Chennai">Chennai</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select-saas"
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
            >
              <option value="">All BHKs</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select-saas"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select-saas"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Independent House">House</option>
              <option value="Villa">Villa</option>
              <option value="Studio">Studio</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="col-12 text-end pt-1">
              <button
                onClick={handleClearFilters}
                className="btn btn-sm btn-link text-decoration-none text-muted"
              >
                <i className="bi bi-x-circle me-1"></i> Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading properties..." />
      ) : properties.length === 0 ? (
        <EmptyState
          icon="bi-building"
          title="No properties found"
          description={
            hasActiveFilters
              ? 'No properties match the selected search criteria.'
              : 'You have not added any properties yet. Add your first listing to start tracking leases and expenses.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Add Property'}
          actionLink={hasActiveFilters ? null : '/properties/new'}
          onActionClick={hasActiveFilters ? handleClearFilters : null}
        />
      ) : (
        <div className="card-saas p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-saas">
              <thead>
                <tr>
                  <th>Property Unit</th>
                  <th>Location</th>
                  <th>Configuration</th>
                  <th>Area</th>
                  <th>Listed Rent</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop._id}>
                    <td>
                      <Link to={`/properties/${prop._id}`} className="fw-bold text-dark text-decoration-none">
                        {prop.title}
                      </Link>
                      <div>
                        <small className="text-muted">
                          {prop.furnishingStatus} · {prop.parking ? 'Parking' : 'No Parking'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>{prop.address?.locality}</div>
                      <small className="text-muted">{prop.address?.city}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {prop.bhk} BHK {prop.propertyType}
                      </span>
                    </td>
                    <td>{prop.areaSqFt} sq.ft</td>
                    <td className="fw-bold text-dark">{formatINR(prop.listedRent)}/mo</td>
                    <td>
                      <StatusBadge status={prop.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/properties/${prop._id}`}
                          className="btn btn-outline-secondary"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                          to={`/properties/${prop._id}/edit`}
                          className="btn btn-outline-secondary"
                          title="Edit Property"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          onClick={() => setDeletingProperty(prop)}
                          className="btn btn-outline-danger"
                          title="Delete Property"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingProperty)}
        title="Delete Property Listing?"
        message={`Are you sure you want to permanently delete '${deletingProperty?.title}'? Note: Properties with an active lease agreement cannot be deleted until the lease is terminated.`}
        confirmText="Delete Property"
        confirmVariant="danger"
        confirmIcon="bi-trash3"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProperty(null)}
      />
    </div>
  );
};

export default PropertiesPage;
