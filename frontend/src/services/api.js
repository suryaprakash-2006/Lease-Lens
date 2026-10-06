/**
 * LeaseLens Centralized API Service Layer
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Helper to get stored auth token
 */
export const getToken = () => {
  return localStorage.getItem('leaselens_token');
};

/**
 * Helper to set stored auth token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('leaselens_token', token);
  } else {
    localStorage.removeItem('leaselens_token');
  }
};

/**
 * Core request execution wrapper with JWT header injection & error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.statusCode = response.status;
      error.errorType = data?.error || 'HttpError';
      error.details = data?.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.statusCode) {
      // Network or connectivity failure
      err.statusCode = 0;
      err.errorType = 'NetworkError';
      err.message = 'Unable to connect to LeaseLens server. Please ensure the backend is running.';
    }
    throw err;
  }
}

// HTTP verbs
export const apiClient = {
  get: (endpoint, query = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, val);
      }
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return request(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post: (endpoint, body) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put: (endpoint, body) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch: (endpoint, body) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};

// 1. Authentication Services
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData)
};

// 2. Properties Services
export const propertiesAPI = {
  getAll: (params) => apiClient.get('/properties', params),
  getById: (id) => apiClient.get(`/properties/${id}`),
  create: (data) => apiClient.post('/properties', data),
  update: (id, data) => apiClient.put(`/properties/${id}`, data),
  delete: (id) => apiClient.delete(`/properties/${id}`)
};

// 3. Leases Services
export const leasesAPI = {
  getAll: (params) => apiClient.get('/leases', params),
  getById: (id) => apiClient.get(`/leases/${id}`),
  create: (data) => apiClient.post('/leases', data),
  update: (id, data) => apiClient.put(`/leases/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/leases/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/leases/${id}`),
  getUpcoming: (days = 30) => apiClient.get('/leases/upcoming', { days })
};

// 4. Expenses Services
export const expensesAPI = {
  getAll: (params) => apiClient.get('/expenses', params),
  getById: (id) => apiClient.get(`/expenses/${id}`),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  getSummary: (params) => apiClient.get('/expenses/summary', params)
};

// 5. Dashboard Services
export const dashboardAPI = {
  getMetrics: () => apiClient.get('/dashboard/metrics'),
  getUpcomingEvents: (days = 30) => apiClient.get('/dashboard/upcoming-events', { days }),
  getExpenseChart: (months = 6) => apiClient.get('/dashboard/expense-chart', { months }),
  getRecentActivity: (limit = 10) => apiClient.get('/dashboard/recent-activity', { limit })
};

export default apiClient;
