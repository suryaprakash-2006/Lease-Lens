import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [expenseChart, setExpenseChart] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, eventsRes, chartRes, activityRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getUpcomingEvents(30),
        dashboardAPI.getExpenseChart(6),
        dashboardAPI.getRecentActivity(6)
      ]);

      setMetrics(metricsRes?.data || null);
      setUpcomingEvents(eventsRes?.data?.events || []);
      setExpenseChart(chartRes?.data || null);
      setRecentActivity(activityRes?.data?.activity || []);
    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard statistics:', err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating portfolio analytics..." />;
  }

  const hasNoData =
    metrics &&
    metrics.properties?.total === 0 &&
    metrics.leases?.active === 0 &&
    metrics.expenses?.totalAllTime === 0;

  return (
    <div>
      {/* Header action bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Portfolio Summary</h3>
          <p className="text-muted small mb-0">
            Real-time occupancy, cash flow, and lease lifecycle tracking
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/properties" className="btn-ll-secondary">
            <i className="bi bi-building"></i> View Properties
          </Link>
          <button onClick={fetchDashboardData} className="btn-ll-secondary" title="Refresh">
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* KPI Stats Grid */}
      <div className="row g-3 mb-4">
        {/* Total Properties Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Total Properties</div>
              <div className="stat-value">{metrics?.properties?.total ?? 0}</div>
              <div className="small text-muted mt-1">
                <span className="text-success fw-semibold">{metrics?.properties?.rented ?? 0} Rented</span> ·{' '}
                <span>{metrics?.properties?.available ?? 0} Available</span>
              </div>
            </div>
            <div className="stat-icon-wrapper bg-primary-subtle text-primary">
              <i className="bi bi-building"></i>
            </div>
          </div>
        </div>

        {/* Active Leases Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Active Leases</div>
              <div className="stat-value">{metrics?.leases?.active ?? 0}</div>
              <div className="small text-muted mt-1">
                <span className="text-info fw-semibold">{metrics?.leases?.upcoming ?? 0} Upcoming</span> ·{' '}
                <span>{metrics?.leases?.expired ?? 0} Expired</span>
              </div>
            </div>
            <div className="stat-icon-wrapper bg-info-subtle text-info">
              <i className="bi bi-file-earmark-text"></i>
            </div>
          </div>
        </div>

        {/* Monthly Rental Income */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Monthly Rent Revenue</div>
              <div className="stat-value">
                ₹{(metrics?.financials?.monthlyRentalIncome ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="small text-muted mt-1">
                Occupancy rate: <strong className="text-dark">{metrics?.properties?.occupancyRate ?? 0}%</strong>
              </div>
            </div>
            <div className="stat-icon-wrapper bg-success-subtle text-success">
              <i className="bi bi-currency-rupee"></i>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Net Monthly Cash Flow</div>
              <div className="stat-value text-dark">
                ₹{(metrics?.financials?.netMonthlyCashFlow ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="small text-muted mt-1">
                Expenses: ₹{(metrics?.financials?.monthlyExpenses ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="stat-icon-wrapper bg-warning-subtle text-warning">
              <i className="bi bi-wallet2"></i>
            </div>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <EmptyState
          icon="bi-speedometer2"
          title="Welcome to your LeaseLens Dashboard!"
          description="Your portfolio metrics will populate in real-time as you add properties, agreements, and expenses."
          actionText="Add Your First Property"
          actionLink="/properties"
        />
      ) : (
        <div className="row g-4">
          {/* Upcoming Lease Alerts & Notice Tracker */}
          <div className="col-lg-7">
            <div className="card-saas h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Upcoming Lease Events</h5>
                  <small className="text-muted">Expiring contracts or move-ins within the next 30 days</small>
                </div>
                <Link to="/leases" className="small fw-semibold text-primary">
                  All Leases <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="p-4 text-center text-muted bg-light rounded-3 my-2">
                  <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
                  <div className="fw-semibold">All clear! No lease deadlines in the next 30 days.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-3 border rounded-3 d-flex align-items-center justify-content-between bg-light-subtle"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${
                            evt.eventType === 'EXPIRATION' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'
                          }`}
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className={`bi ${evt.eventType === 'EXPIRATION' ? 'bi-hourglass-split' : 'bi-box-arrow-in-right'}`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{evt.property?.title || 'Property'}</div>
                          <div className="small text-muted">
                            Tenant: <strong>{evt.tenant?.name}</strong> · Rent: ₹{evt.monthlyRent?.toLocaleString('en-IN')}/mo
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${evt.daysRemaining <= 7 ? 'bg-danger' : 'bg-warning text-dark'} px-2 py-1`}>
                          {evt.daysRemaining} days left
                        </span>
                        <div className="small text-muted mt-1">
                          {new Date(evt.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown & Spending Distribution */}
          <div className="col-lg-5">
            <div className="card-saas h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Expense Breakdown</h5>
                  <small className="text-muted">Categorized operational distribution</small>
                </div>
                <Link to="/expenses" className="small fw-semibold text-primary">
                  All Expenses <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {(!expenseChart?.categories || expenseChart.categories.length === 0) ? (
                <div className="p-4 text-center text-muted bg-light rounded-3 my-2">
                  <i className="bi bi-receipt text-muted fs-3 d-block mb-2"></i>
                  <div className="fw-semibold">No expenses logged yet</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {expenseChart.categories.map((cat) => (
                    <div key={cat.category}>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="fw-semibold text-dark">{cat.category}</span>
                        <span className="text-muted">
                          ₹{cat.totalAmount.toLocaleString('en-IN')} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="progress" style={{ height: '7px' }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${cat.percentage}%` }}
                          aria-valuenow={cat.percentage}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Portfolio Activity Feed */}
          <div className="col-12">
            <div className="card-saas">
              <h5 className="fw-bold mb-3">Recent Activity Feed</h5>
              {recentActivity.length === 0 ? (
                <p className="text-muted mb-0 small">No recent activity recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-saas">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Status / Amount</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((act, index) => (
                        <tr key={index}>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary border">
                              {act.type}
                            </span>
                          </td>
                          <td className="fw-semibold">{act.action}</td>
                          <td>
                            <div className="fw-bold text-dark">{act.title}</div>
                            {act.subtitle && <small className="text-muted">{act.subtitle}</small>}
                          </td>
                          <td>
                            {act.status && <StatusBadge status={act.status} />}
                            {act.amount !== undefined && (
                              <span className="fw-semibold text-dark">₹{act.amount.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="text-muted small">
                            {new Date(act.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
