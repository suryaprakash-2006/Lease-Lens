import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI, propertiesAPI } from '../../services/api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');

  // Quick-Add Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Maintenance',
    amount: '',
    propertyId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    isRecurringMonthly: false,
    notes: ''
  });

  const fetchExpensesAndSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expRes, sumRes, propRes] = await Promise.all([
        expensesAPI.getAll({ category: categoryFilter }),
        expensesAPI.getSummary(),
        propertiesAPI.getAll({ limit: 100 })
      ]);

      setExpenses(expRes?.data?.expenses || []);
      setSummary(sumRes?.data || null);
      setProperties(propRes?.data?.properties || []);
    } catch (err) {
      console.error('[Expenses] Error fetching expenses:', err);
      setError(err.message || 'Failed to fetch expense records.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchExpensesAndSummary();
  }, [fetchExpensesAndSummary]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const payload = {
      title: formData.title,
      category: formData.category,
      amount: Number(formData.amount),
      propertyId: formData.propertyId ? formData.propertyId : null,
      expenseDate: new Date(formData.expenseDate).toISOString(),
      isRecurringMonthly: Boolean(formData.isRecurringMonthly),
      notes: formData.notes
    };

    try {
      await expensesAPI.create(payload);
      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'Maintenance',
        amount: '',
        propertyId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        isRecurringMonthly: false,
        notes: ''
      });
      fetchExpensesAndSummary();
    } catch (err) {
      setFormError(err.message || 'Failed to log expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Operating Expenses</h3>
          <p className="text-muted small mb-0">
            Log and analyze property maintenance, utilities, taxes, and recurring overheads
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-ll-primary"
          >
            <i className="bi bi-plus-lg"></i> Log New Expense
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value text-danger">
                ₹{(summary?.totalExpenses || 0).toLocaleString('en-IN')}
              </div>
              <div className="small text-muted mt-1">{summary?.expenseCount || 0} total logs</div>
            </div>
            <div className="stat-icon-wrapper bg-danger-subtle text-danger">
              <i className="bi bi-wallet2"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Average Expense</div>
              <div className="stat-value text-dark">
                ₹{(summary?.averageExpense || 0).toLocaleString('en-IN')}
              </div>
              <div className="small text-muted mt-1">per transaction</div>
            </div>
            <div className="stat-icon-wrapper bg-primary-subtle text-primary">
              <i className="bi bi-calculator"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Active Categories</div>
              <div className="stat-value text-primary">
                {summary?.byCategory?.length || 0}
              </div>
              <div className="small text-muted mt-1">spending streams</div>
            </div>
            <div className="stat-icon-wrapper bg-info-subtle text-info">
              <i className="bi bi-tags"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-saas mb-4 p-3">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select-saas"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Internet">Internet</option>
              <option value="Repairs">Repairs</option>
              <option value="Taxes">Taxes</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter('')}
              className="btn-ll-secondary"
            >
              <i className="bi bi-x-circle"></i> Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <LoadingSpinner message="Loading expense records..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="bi-receipt"
          title="No expenses logged"
          description={
            categoryFilter
              ? 'No expenses found under the selected category.'
              : 'You have not logged any expenses yet. Record maintenance, repairs, or utility bills to monitor operational cash outflow.'
          }
          actionText="Log First Expense"
          onActionClick={() => setShowAddModal(true)}
        />
      ) : (
        <div className="card-saas p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-saas">
              <thead>
                <tr>
                  <th>Title / Purpose</th>
                  <th>Category</th>
                  <th>Property Unit</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td className="fw-bold text-dark">{exp.title}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      {exp.propertyId ? (
                        <div>
                          <div className="fw-semibold">{exp.propertyId.title}</div>
                          <small className="text-muted">{exp.propertyId.address?.city}</small>
                        </div>
                      ) : (
                        <span className="badge bg-light text-muted border">Portfolio-Wide</span>
                      )}
                    </td>
                    <td className="fw-bold text-dark">
                      ₹{exp.amount?.toLocaleString('en-IN')}
                    </td>
                    <td>{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</td>
                    <td className="text-muted small">{exp.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Log New Expense</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateExpense}>
                <div className="modal-body p-4">
                  <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />

                  <div className="mb-3">
                    <label className="form-label-saas">Expense Title</label>
                    <input
                      type="text"
                      className="form-control-saas"
                      placeholder="e.g. Plumbing Repair Master Bath"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label-saas">Category</label>
                      <select
                        className="form-select-saas"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="Maintenance">Maintenance</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Water">Water</option>
                        <option value="Internet">Internet</option>
                        <option value="Repairs">Repairs</option>
                        <option value="Taxes">Taxes</option>
                        <option value="Rent">Rent</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label-saas">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control-saas"
                        placeholder="e.g. 2500"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-saas">Property (Optional)</label>
                    <select
                      className="form-select-saas"
                      value={formData.propertyId}
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    >
                      <option value="">General / Portfolio-Wide</option>
                      {properties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.address?.locality})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-saas">Expense Date</label>
                    <input
                      type="date"
                      className="form-control-saas"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label-saas">Notes (Optional)</label>
                    <textarea
                      rows="2"
                      className="form-control-saas"
                      placeholder="Add any additional details or invoice references"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn-ll-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-ll-primary">
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      'Log Expense'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
