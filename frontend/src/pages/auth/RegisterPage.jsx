import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setErrorDetails(err.details || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <div className="card-saas w-100 shadow-lg border-0" style={{ maxWidth: '480px', padding: '2.5rem' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-2">
            <span className="fs-2">🏢</span>
            <span className="h3 fw-bold text-dark mb-0">LeaseLens</span>
          </Link>
          <h5 className="fw-bold text-dark mt-2 mb-1">Create Landlord Account</h5>
          <p className="text-muted small mb-0">Start managing your rental properties & agreements</p>
        </div>

        {/* Error Alert */}
        <ErrorAlert
          message={error}
          details={errorDetails}
          onDismiss={() => { setError(null); setErrorDetails(null); }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-saas">Full Name</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control-saas border-start-0"
                placeholder="Arun Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label-saas">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control-saas border-start-0"
                placeholder="arun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label-saas">Phone Number (Optional)</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-telephone"></i>
              </span>
              <input
                type="tel"
                className="form-control-saas border-start-0"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-4">
            <div className="col-sm-6">
              <label className="form-label-saas">Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="At least 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="col-sm-6">
              <label className="form-label-saas">Confirm Password</label>
              <input
                type="password"
                className="form-control-saas"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ll-primary w-100 justify-content-center py-2 fs-6 mb-3"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating Account...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle"></i>
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-3 pt-3 border-top">
          <p className="text-muted small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="fw-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
