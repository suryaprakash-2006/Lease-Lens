import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { to: '/properties', label: 'Properties', icon: 'bi-building' },
    { to: '/leases', label: 'Lease Agreements', icon: 'bi-file-earmark-text' },
    { to: '/expenses', label: 'Expense Tracker', icon: 'bi-cash-coin' },
    { to: '/predict', label: 'Rent Prediction', icon: 'bi-graph-up-arrow' },
    { to: '/profile', label: 'Account Profile', icon: 'bi-person-circle' }
  ];

  // Helper for top header title and section context
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { section: 'Portfolio Analytics', title: 'Dashboard Overview' };
    }
    if (path.startsWith('/properties')) {
      return { section: 'Real Estate Portfolio', title: 'Properties Portfolio' };
    }
    if (path.startsWith('/leases')) {
      return { section: 'Contracts & Tenancy', title: 'Lease Agreements' };
    }
    if (path.startsWith('/expenses')) {
      return { section: 'Financial Tracking', title: 'Operating Expenses' };
    }
    if (path.startsWith('/predict')) {
      return { section: 'AI Market Intelligence', title: 'AI Rent Prediction' };
    }
    if (path.startsWith('/profile')) {
      return { section: 'Account Settings', title: 'User Profile & Settings' };
    }
    return { section: 'Platform', title: 'LeaseLens' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Warm-Charcoal Architectural Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'show' : ''}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-brand-badge" aria-hidden="true">
              <i className="bi bi-buildings-fill"></i>
            </div>
            <span className="sidebar-brand-title">LeaseLens</span>
          </div>
          <span className="sidebar-brand-pill">OPS</span>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">
            WORKSPACE
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link-custom ${isActive ? 'active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`} aria-hidden="true"></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Information Area & Logout */}
        <div className="sidebar-footer">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 overflow-hidden flex-grow-1">
              <div className="sidebar-user-avatar" aria-hidden="true">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-white small fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
                  {user?.name || 'User'}
                </div>
                <div className="text-truncate" style={{ fontSize: '0.72rem', color: '#a8a29e' }}>
                  {user?.role === 'admin' ? 'Administrator' : 'Landlord'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Sign Out"
              aria-label="Sign Out of LeaseLens"
            >
              <i className="bi bi-box-arrow-right fs-6"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* App Header */}
        <header className="app-header">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none p-1 px-2 border"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>

            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="d-none d-md-inline-block text-muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  {pageInfo.section}
                </span>
                <span className="d-none d-md-inline-block text-muted" style={{ fontSize: '0.78rem' }}>/</span>
                <h5 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.02em' }}>
                  {pageInfo.title}
                </h5>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Live Status indicator */}
            <div className="d-none d-sm-flex align-items-center gap-2 px-2 py-1 rounded border bg-light" style={{ fontSize: '0.75rem', borderColor: 'var(--ll-border)' }}>
              <span className="rounded-circle bg-success" style={{ width: '7px', height: '7px' }}></span>
              <span className="text-muted fw-medium">Live Ops</span>
            </div>

            <div className="d-none d-md-block text-end">
              <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{user?.name}</div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                {user?.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-2 px-2 py-1 fw-medium"
              style={{ fontSize: '0.8rem' }}
              title="Sign out of account"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
