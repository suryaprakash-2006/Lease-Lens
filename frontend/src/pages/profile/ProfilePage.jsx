import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setSuccessMsg(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim()
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (!currentPassword) {
        setError('Current password is required to set a new password.');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      setSuccessMsg('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Account Profile</h3>
        <p className="text-muted small mb-0">
          Manage your personal credentials, contact info, and security preferences
        </p>
      </div>

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 my-3" role="alert">
          <i className="bi bi-check-circle-fill"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card-saas mb-4 p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-3"
            style={{ width: '64px', height: '64px' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h5 className="fw-bold mb-0">{user?.name}</h5>
            <div className="text-muted small">{user?.email}</div>
            <span className="badge bg-light text-muted border px-2 py-1 mt-1" style={{ fontSize: '0.75rem' }}>
              Role: {user?.role === 'admin' ? 'Administrator' : 'Landlord'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">General Information</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label-saas">Full Name</label>
              <input
                type="text"
                className="form-control-saas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-control-saas bg-light text-muted"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Phone Number</label>
              <input
                type="tel"
                className="form-control-saas"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Change Password</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <label className="form-label-saas">Current Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="Enter current password if changing password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">New Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="At least 6 chars"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">Confirm New Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end border-top pt-3">
            <button type="submit" disabled={saving} className="btn-ll-primary">
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
