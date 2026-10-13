import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api.js';
import { formatINR, formatDate, formatDaysRemaining, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [expenseChart, setExpenseChart] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, eventsRes, chartRes, activityRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getUpcomingEvents(30),
        dashboardAPI.getExpenseChart(6),
        dashboardAPI.getRecentActivity(8)
      ]);

      setMetrics(metricsRes?.data || null);
      setUpcomingEvents(eventsRes?.data?.events || []);
      setExpenseChart(chartRes?.data || null);
      setRecentActivity(activityRes?.data?.activity || []);
    } catch (err) {
      console.error('[Dashboard] Error fetching statistics:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Calculating portfolio analytics and cash flow..." />;
  }

  const hasNoData =
    metrics &&
    metrics.properties?.total === 0 &&
    metrics.leases?.active === 0 &&
    metrics.expenses?.totalAllTime === 0;

  return (
    <div className="dashboard-page-container">
      {/* Standardized Reusable Page Header */}
      <PageHeader
        title="Portfolio Summary"
        subtitle="Real-time occupancy tracking, lease lifecycle notifications, and operational cash flow analytics"
        badge={
          <span
            className="badge rounded-pill bg-light border text-muted px-2 py-1"
            style={{ fontSize: '0.72rem', borderColor: 'var(--ll-border)' }}
          >
            Live Operations
          </span>
        }
        actions={
          <>
            <Link to="/properties/new" className="btn-ll-primary">
              <i className="bi bi-plus-lg" aria-hidden="true"></i>
              <span>Add Property</span>
            </Link>
            <button
              onClick={fetchDashboardData}
              className="btn-ll-secondary"
              title="Refresh Dashboard Metrics"
              aria-label="Refresh Dashboard Metrics"
            >
              <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {/* Dismissible Error Alert */}
      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* KPI Stats Grid (Using Reusable StatCard Component) */}
      <div className="row g-3 mb-4">
        {/* Total Properties */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="TOTAL PROPERTIES"
            value={metrics?.properties?.total ?? 0}
            supportingText={
              <span>
                <strong className="text-success">{metrics?.properties?.rented ?? 0} Rented</strong> ·{' '}
                <span>{metrics?.properties?.available ?? 0} Available</span>
              </span>
            }
            icon="bi-building"
            variant="primary"
            className="h-100"
          />
        </div>

        {/* Active Leases */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="ACTIVE LEASES"
            value={metrics?.leases?.active ?? 0}
            supportingText={
              <span>
                <strong className="text-info">{metrics?.leases?.upcoming ?? 0} Upcoming</strong> ·{' '}
                <span>{metrics?.leases?.expired ?? 0} Expired</span>
              </span>
            }
            icon="bi-file-earmark-text"
            variant="info"
            className="h-100"
          />
        </div>

        {/* Monthly Rental Income */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="MONTHLY RENTAL REVENUE"
            value={formatINR(metrics?.financials?.monthlyRentalIncome ?? 0)}
            supportingText={
              <span>
                Occupancy Rate: <strong className="text-dark">{metrics?.properties?.occupancyRate ?? 0}%</strong>
              </span>
            }
            trend={{
              direction: (metrics?.properties?.occupancyRate ?? 0) > 0 ? 'up' : 'neutral',
              label: `${metrics?.properties?.occupancyRate ?? 0}% Occupancy`,
              positive: (metrics?.properties?.occupancyRate ?? 0) > 0
            }}
            icon="bi-currency-rupee"
            variant="success"
            className="h-100"
          />
        </div>

        {/* Net Cash Flow */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="NET MONTHLY CASH FLOW"
            value={formatINR(metrics?.financials?.netMonthlyCashFlow ?? 0)}
            supportingText={
              <span>
                Expenses: <strong>{formatINR(metrics?.financials?.monthlyExpenses ?? 0)}</strong>
              </span>
            }
            icon="bi-wallet2"
            variant="warning"
            className="h-100"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {hasNoData ? (
        <EmptyState
          icon="bi-speedometer2"
          title="Welcome to your LeaseLens Dashboard!"
          description="Your portfolio metrics, agreements, and cash flow will update automatically as you add listings, leases, and expenses."
          actionText="Add Your First Property"
          actionLink="/properties/new"
        />
      ) : (
        <div className="row g-4">
          {/* Upcoming Lease Alerts & Notice Tracker */}
          <div className="col-lg-7">
            <div className="card-saas h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'var(--ll-heading-font)' }}>
                    Upcoming Lease Events
                  </h5>
                  <small className="text-muted">Expiring contracts or move-in deadlines within 30 days</small>
                </div>
                <Link to="/leases" className="small fw-semibold text-primary d-inline-flex align-items-center gap-1">
                  <span>View All Leases</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div
                  className="p-4 text-center rounded-3 my-2"
                  style={{
                    backgroundColor: 'var(--ll-surface-subtle)',
                    border: '1px dashed var(--ll-border)'
                  }}
                >
                  <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
                  <div className="fw-semibold text-dark">All contracts healthy!</div>
                  <small className="text-muted">No pending renewals or move-ins in the next 30 days.</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                      style={{
                        backgroundColor: 'var(--ll-canvas)',
                        border: '1px solid var(--ll-border)',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-2 d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor:
                              evt.eventType === 'EXPIRATION' ? 'var(--ll-danger-bg)' : 'var(--ll-info-bg)',
                            color:
                              evt.eventType === 'EXPIRATION' ? 'var(--ll-danger)' : 'var(--ll-info)',
                            border: `1px solid ${
                              evt.eventType === 'EXPIRATION'
                                ? 'var(--ll-danger-border)'
                                : 'var(--ll-info-border)'
                            }`
                          }}
                        >
                          <i
                            className={`bi ${
                              evt.eventType === 'EXPIRATION' ? 'bi-hourglass-split' : 'bi-box-arrow-in-right'
                            } fs-5`}
                            aria-hidden="true"
                          ></i>
                        </div>
                        <div>
                          <Link
                            to={`/leases/${evt._id}`}
                            className="fw-bold text-dark text-decoration-none"
                          >
                            {evt.property?.title || 'Property Unit'}
                          </Link>
                          <div className="small text-muted">
                            Tenant: <strong className="text-dark">{evt.tenant?.name}</strong> · Rent:{' '}
                            <span className="tabular-nums fw-medium">{formatINR(evt.monthlyRent)}/mo</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <span
                          className="badge px-2 py-1"
                          style={{
                            backgroundColor:
                              evt.daysRemaining <= 7 ? 'var(--ll-danger-bg)' : 'var(--ll-warning-bg)',
                            color:
                              evt.daysRemaining <= 7 ? 'var(--ll-danger)' : 'var(--ll-warning)',
                            border: `1px solid ${
                              evt.daysRemaining <= 7
                                ? 'var(--ll-danger-border)'
                                : 'var(--ll-warning-border)'
                            }`,
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          <i className="bi bi-clock me-1" aria-hidden="true"></i>
                          {formatDaysRemaining(evt.daysRemaining)}
                        </span>
                        <div className="small text-muted mt-1 tabular-nums" style={{ fontSize: '0.75rem' }}>
                          {formatDate(evt.targetDate)}
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
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'var(--ll-heading-font)' }}>
                    Expense Breakdown
                  </h5>
                  <small className="text-muted">Categorized operational distribution</small>
                </div>
                <Link to="/expenses" className="small fw-semibold text-primary d-inline-flex align-items-center gap-1">
                  <span>Manage Expenses</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {!expenseChart?.categories || expenseChart.categories.length === 0 ? (
                <div
                  className="p-4 text-center rounded-3 my-2"
                  style={{
                    backgroundColor: 'var(--ll-surface-subtle)',
                    border: '1px dashed var(--ll-border)'
                  }}
                >
                  <i className="bi bi-receipt text-muted fs-3 d-block mb-2"></i>
                  <div className="fw-semibold text-dark">No operational expenses logged yet</div>
                  <small className="text-muted">Track property maintenance, taxes, and utility bills here.</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {expenseChart.categories.map((cat, idx) => {
                    const barColors = ['var(--ll-primary)', '#2C5282', '#216E4E', '#8F5E15', '#78716C'];
                    const barColor = barColors[idx % barColors.length];

                    return (
                      <div key={cat.category}>
                        <div className="d-flex justify-content-between align-items-center mb-1 small">
                          <span className="fw-semibold text-dark">{cat.category}</span>
                          <span className="text-muted tabular-nums">
                            <strong>{formatINR(cat.totalAmount)}</strong> ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: '6px', backgroundColor: 'var(--ll-surface-subtle)' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: barColor,
                              borderRadius: '4px'
                            }}
                            aria-valuenow={cat.percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Portfolio Activity Feed */}
          <div className="col-12">
            <div className="card-saas">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'var(--ll-heading-font)' }}>
                    Recent Activity Feed
                  </h5>
                  <small className="text-muted">Unified portfolio audit log</small>
                </div>
              </div>

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
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((act, index) => (
                        <tr key={index}>
                          <td>
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: 'var(--ll-surface-subtle)',
                                color: 'var(--ll-text-secondary)',
                                border: '1px solid var(--ll-border)',
                                fontSize: '0.72rem'
                              }}
                            >
                              {act.type}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">{act.action}</td>
                          <td>
                            <div className="fw-bold text-dark">{act.title}</div>
                            {act.subtitle && <small className="text-muted">{act.subtitle}</small>}
                          </td>
                          <td>
                            {act.status && <StatusBadge status={act.status} />}
                            {act.amount !== undefined && (
                              <span className="fw-semibold text-dark tabular-nums">
                                {formatINR(act.amount)}
                              </span>
                            )}
                          </td>
                          <td className="text-muted small tabular-nums">
                            {formatDate(act.timestamp, { hour: '2-digit', minute: '2-digit' })}
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
