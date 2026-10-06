import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI, propertiesAPI } from '../../services/api.js';
import { formatINR, formatDate, getErrorMessage } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Electricity',
  'Water',
  'Internet',
  'Repairs',
  'Taxes',
  'Rent',
  'Other'
];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formDetails, setFormDetails] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Maintenance',
    amount: '',
    propertyId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    isRecurringMonthly: false,
    notes: ''
  });

  // Delete modal state
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpensesAndSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {};
      if (categoryFilter) queryParams.category = categoryFilter;
      if (propertyFilter) queryParams.propertyId = propertyFilter;

      const [expRes, sumRes, propRes] = await Promise.all([
        expensesAPI.getAll(queryParams),
        expensesAPI.getSummary(queryParams),
        propertiesAPI.getAll({ limit: 100 })
      ]);

      setExpenses(expRes?.data?.expenses || []);
      setSummary(sumRes?.data || null);
      setProperties(propRes?.data?.properties || []);
    } catch (err) {
      console.error('[Expenses] Error fetching expenses:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, propertyFilter]);

  useEffect(() => {
    fetchExpensesAndSummary();
  }, [fetchExpensesAndSummary]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingExpenseId(null);
    setFormError(null);
    setFormDetails(null);
    setFormData({
      title: '',
      category: 'Maintenance',
      amount: '',
      propertyId: properties.length > 0 ? properties[0]._id : '',
      expenseDate: new Date().toISOString().split('T')[0],
      isRecurringMonthly: false,
      notes: ''
    });
  };

  const openEditModal = (exp) => {
    setModalMode('edit');
    setEditingExpenseId(exp._id);
    setFormError(null);
    setFormDetails(null);
    setFormData({
      title: exp.title || '',
      category: exp.category || 'Maintenance',
      amount: exp.amount || '',
      propertyId: exp.propertyId?._id || '',
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isRecurringMonthly: Boolean(exp.isRecurringMonthly),
      notes: exp.notes || ''
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingExpenseId(null);
    setFormError(null);
    setFormDetails(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormDetails(null);

    if (!formData.title.trim()) {
      setFormError('Expense title is required.');
      return;
    }
    if (Number(formData.amount) <= 0) {
      setFormError('Expense amount must be greater than zero.');
      return;
    }

    setSaving(true);
    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      amount: Number(formData.amount),
      propertyId: formData.propertyId ? formData.propertyId : null,
      expenseDate: new Date(formData.expenseDate).toISOString(),
      isRecurringMonthly: Boolean(formData.isRecurringMonthly),
      notes: formData.notes.trim()
    };

    try {
      if (modalMode === 'edit' && editingExpenseId) {
        await expensesAPI.update(editingExpenseId, payload);
      } else {
        await expensesAPI.create(payload);
      }
      closeModal();
      fetchExpensesAndSummary();
    } catch (err) {
      setFormError(getErrorMessage(err));
      setFormDetails(err.details || null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await expensesAPI.delete(deletingExpense._id);
      setDeletingExpense(null);
      fetchExpensesAndSummary();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeletingExpense(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters = Boolean(categoryFilter || propertyFilter);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Operating Expenses</h3>
          <p className="text-muted small mb-0">
            Log and analyze property maintenance, utilities, repairs, and operational cash outflow
          </p>
        </div>
        <div>
          <button onClick={openCreateModal} className="btn-ll-primary">
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
                {formatINR(summary?.totalExpenses || 0)}
              </div>
              <div className="small text-muted mt-1">{summary?.expenseCount || 0} recorded transactions</div>
            </div>
            <div className="stat-icon-wrapper bg-danger-subtle text-danger">
              <i className="bi bi-wallet2"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="stat-card h-100">
            <div>
              <div className="stat-label">Average Outlay</div>
              <div className="stat-value text-dark">
                {formatINR(summary?.averageExpense || 0)}
              </div>
              <div className="small text-muted mt-1">per expense entry</div>
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
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select-saas"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '220px' }}>
            <select
              className="form-select-saas"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="">All Units & General</option>
              <option value="unassigned">General / Portfolio-Wide Only</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setCategoryFilter('');
                setPropertyFilter('');
              }}
              className="btn-ll-secondary ms-auto"
            >
              <i className="bi bi-x-circle"></i> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading expense records..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="bi-receipt"
          title="No expenses logged"
          description={
            hasActiveFilters
              ? 'No expense entries match the selected filter criteria.'
              : 'You have not logged any expenses yet. Record maintenance, repairs, or utility bills to monitor operational cash outflow.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Log First Expense'}
          onActionClick={hasActiveFilters ? () => { setCategoryFilter(''); setPropertyFilter(''); } : openCreateModal}
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
                  <th>Expense Date</th>
                  <th>Notes</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      <div className="fw-bold text-dark">{exp.title}</div>
                      {exp.isRecurringMonthly && (
                        <span className="badge bg-info-subtle text-info border" style={{ fontSize: '0.7rem' }}>
                          Recurring Monthly
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      {exp.propertyId ? (
                        <div>
                          <div className="fw-semibold text-dark">{exp.propertyId.title}</div>
                          <small className="text-muted">{exp.propertyId.address?.locality || ''}</small>
                        </div>
                      ) : (
                        <span className="badge bg-light text-muted border">Portfolio-Wide</span>
                      )}
                    </td>
                    <td className="fw-bold text-dark">{formatINR(exp.amount)}</td>
                    <td>{formatDate(exp.expenseDate)}</td>
                    <td className="text-muted small">{exp.notes || '—'}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="btn btn-outline-secondary"
                          title="Edit Expense"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="btn btn-outline-danger"
                          title="Delete Expense"
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

      {/* Add / Edit Expense Modal */}
      {modalMode && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div className="modal-content rounded-3 border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  {modalMode === 'edit' ? 'Edit Expense Record' : 'Log New Expense'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                  disabled={saving}
                ></button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <ErrorAlert message={formError} details={formDetails} onDismiss={() => setFormError(null)} />

                  <div className="mb-3">
                    <label className="form-label-saas">Expense Title / Description</label>
                    <input
                      type="text"
                      className="form-control-saas"
                      placeholder="e.g. Master Bedroom Plumbing Leak Repair"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label-saas">Category</label>
                      <select
                        className="form-select-saas"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label-saas">Amount (₹)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control-saas"
                        placeholder="e.g. 3500"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-saas">Assigned Property (Optional)</label>
                    <select
                      className="form-select-saas"
                      value={formData.propertyId}
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    >
                      <option value="">General / Portfolio-Wide (Unassigned)</option>
                      {properties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.address?.locality}, {p.address?.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-saas">Transaction Date</label>
                    <input
                      type="date"
                      className="form-control-saas"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="recurringCheck"
                        className="form-check-input"
                        checked={formData.isRecurringMonthly}
                        onChange={(e) => setFormData({ ...formData, isRecurringMonthly: e.target.checked })}
                      />
                      <label className="form-check-label text-dark small" htmlFor="recurringCheck">
                        Recurring Monthly Expense (e.g. Society Maintenance, Broadband)
                      </label>
                    </div>
                  </div>

                  <div className="mb-0">
                    <label className="form-label-saas">Invoice / Reference Notes (Optional)</label>
                    <textarea
                      rows="2"
                      className="form-control-saas"
                      placeholder="e.g. Paid via UPI to contractor, invoice ref #402"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-3 py-2 fw-semibold"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-sm btn-primary px-3 py-2 fw-semibold">
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      modalMode === 'edit' ? 'Update Expense' : 'Log Expense'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingExpense)}
        title="Delete Expense Entry?"
        message={`Are you sure you want to delete '${deletingExpense?.title}' (${formatINR(deletingExpense?.amount)})? This will remove the transaction from cash flow calculations.`}
        confirmText="Delete Expense"
        confirmVariant="danger"
        confirmIcon="bi-trash3"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
};

export default ExpensesPage;
