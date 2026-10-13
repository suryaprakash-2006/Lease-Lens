import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDate, getErrorMessage } from '../../utils/formatters.js';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

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

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim()
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation password do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (!currentPassword) {
        setError('Current password is required to authorize a password change.');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      setSuccessMsg('Account profile successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Account Profile & Settings"
        subtitle="Manage your personal credentials, contact info, and security preferences"
        badge={
          <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.75rem' }}>
            {user?.role === 'admin' ? 'Administrator' : 'Landlord Account'}
          </span>
        }
      />

      <ErrorAlert message={error} details={errorDetails} onDismiss={() => setError(null)} />

      {successMsg && (
        <div
          className="alert alert-success d-flex align-items-center justify-content-between rounded-3 border-0 my-3"
          style={{ backgroundColor: 'var(--ll-success-bg)', border: '1px solid var(--ll-success-border)', color: 'var(--ll-success)' }}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <span className="fw-semibold">{successMsg}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setSuccessMsg(null)}
          ></button>
        </div>
      )}

      {/* Profile Card */}
      <div className="card-saas mb-4 p-4">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-3 shadow-sm"
            style={{ width: '64px', height: '64px', backgroundColor: 'var(--ll-primary)' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
            <div className="text-muted small mb-2">{user?.email}</div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.725rem' }}>
                Role: {user?.role === 'admin' ? 'Administrator' : 'Landlord'}
              </span>
              <span className="text-muted small">
                <i className="bi bi-calendar3 me-1"></i> Member since {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="form-section-header">
            <i className="bi bi-person-badge text-primary"></i> 1. Contact & Identity Information
          </div>
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
              <label className="form-label-saas">Contact Phone Number</label>
              <input
                type="tel"
                className="form-control-saas"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section-header">
            <i className="bi bi-shield-lock text-primary"></i> 2. Security & Password Change
          </div>
          <p className="text-muted small mb-3">
            Leave password fields empty unless you want to change your account password.
          </p>

          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label-saas">Current Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="Enter current password to verify identity"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-saas">New Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="Minimum 6 characters"
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
                  Saving Profile...
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i> Save Changes
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
