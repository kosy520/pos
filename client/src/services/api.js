import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
};

export const products = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/reports/low-stock'),
};

export const customers = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getPurchases: (id) => api.get(`/customers/${id}/purchases`),
};

export const sales = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getSummary: (params) => api.get('/sales/reports/summary', { params }),
};

export const inventory = {
  getMovements: (params) => api.get('/inventory/movements', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  getValue: () => api.get('/inventory/value'),
};

export const invoices = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
};

export const stockTakes = {
  getAll: (params) => api.get('/stock-takes', { params }),
  getById: (id) => api.get(`/stock-takes/${id}`),
  create: (data) => api.post('/stock-takes', data),
  updateItem: (id, data) => api.put(`/stock-takes/items/${id}`, data),
  complete: (id) => api.post(`/stock-takes/${id}/complete`),
};

export const sync = {
  queue: (data) => api.post('/sync/queue', data),
  getPending: () => api.get('/sync/queue/pending'),
  markComplete: (id) => api.put(`/sync/queue/${id}/complete`),
  clearCompleted: () => api.delete('/sync/queue/completed'),
  getStatus: () => api.get('/sync/status'),
};

export default api;
