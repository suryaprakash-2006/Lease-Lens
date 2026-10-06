import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white min-vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark fs-4" to="/">
            <span className="fs-3">🏢</span>
            <span>LeaseLens</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-ll-primary">
                <i className="bi bi-grid-fill"></i>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-link text-decoration-none fw-semibold text-dark">
                  Sign In
                </Link>
                <Link to="/register" className="btn-ll-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 my-auto">
        <div className="container py-4 text-center">
          <div className="badge bg-light text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold mb-3">
            ✨ Intelligent Rental & Lease Management Platform
          </div>

          <h1 className="display-4 fw-extrabold text-dark mb-3 mx-auto" style={{ maxWidth: '800px' }}>
            Unified Real Estate Intelligence for Modern Landlords
          </h1>

          <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '640px' }}>
            Seamlessly monitor property portfolios, automate lease lifecycle tracking, aggregate operational expenses, and gain actionable cash flow insights.
          </p>

          <div className="d-flex justify-content-center gap-3 mb-5">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-ll-primary px-4 py-3 fs-5">
                Open Dashboard <i className="bi bi-arrow-right"></i>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-ll-primary px-4 py-3 fs-6">
                  Create Free Account <i className="bi bi-arrow-right"></i>
                </Link>
                <Link to="/login" className="btn-ll-secondary px-4 py-3 fs-6">
                  Sign In to Portal
                </Link>
              </>
            )}
          </div>

          {/* Feature Grid */}
          <div className="row g-4 mt-4 text-start">
            <div className="col-md-4">
              <div className="card-saas h-100 p-4">
                <div className="stat-icon-wrapper bg-primary-subtle text-primary mb-3">
                  <i className="bi bi-building"></i>
                </div>
                <h5 className="fw-bold mb-2">Property Portfolio</h5>
                <p className="text-muted small mb-0">
                  Manage multi-unit listings, track occupancy statuses, furnishing details, and amenities in one centralized hub.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card-saas h-100 p-4">
                <div className="stat-icon-wrapper bg-success-subtle text-success mb-3">
                  <i className="bi bi-file-earmark-check-fill"></i>
                </div>
                <h5 className="fw-bold mb-2">Automated Lease Lifecycle</h5>
                <p className="text-muted small mb-0">
                  Automate status transitions from upcoming to active and expired. Never miss a 30-day lease expiration notice.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card-saas h-100 p-4">
                <div className="stat-icon-wrapper bg-warning-subtle text-warning mb-3">
                  <i className="bi bi-pie-chart-fill"></i>
                </div>
                <h5 className="fw-bold mb-2">Expense Analytics & KPIs</h5>
                <p className="text-muted small mb-0">
                  Log operational costs with categorized breakdown and monitor net monthly rental cash flow with high-performance aggregations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-top text-center text-muted small mt-auto bg-light">
        <div className="container">
          &copy; {new Date().getFullYear()} LeaseLens. Built with React, Vite, Node.js, and MongoDB.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
