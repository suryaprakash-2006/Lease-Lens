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
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { to: '/properties', label: 'Properties', icon: 'bi-building' },
    { to: '/leases', label: 'Lease Agreements', icon: 'bi-file-earmark-text-fill' },
    { to: '/expenses', label: 'Expense Tracker', icon: 'bi-cash-coin' },
    { to: '/profile', label: 'Account Profile', icon: 'bi-person-circle' }
  ];

  // Helper for top header title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/properties')) return 'Properties Portfolio';
    if (path.startsWith('/leases')) return 'Lease Agreements';
    if (path.startsWith('/expenses')) return 'Operating Expenses';
    if (path.startsWith('/profile')) return 'User Profile & Settings';
    return 'LeaseLens';
  };

  return (
    <div className="app-container">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'show' : ''}`}>
        <div className="sidebar-brand">
          <span className="me-2 fs-4">🏢</span>
          <span className="fw-bold tracking-tight">LeaseLens</span>
        </div>

        <nav className="sidebar-nav">
          <div className="text-uppercase text-muted px-3 mb-2" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            Main Menu
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
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="text-white small fw-bold text-truncate">{user?.name || 'User'}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-secondary text-light border-0 p-1"
              title="Log Out"
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
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
              className="btn btn-outline-secondary d-lg-none p-1 px-2 border-0"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <i className="bi bi-list fs-3"></i>
            </button>
            <h4 className="mb-0 fw-bold">{getPageTitle()}</h4>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-sm-block text-end">
              <div className="fw-bold small text-dark">{user?.name}</div>
              <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Landlord'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-3 px-3 py-2 fw-semibold"
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
