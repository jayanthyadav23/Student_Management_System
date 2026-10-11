import api from './client';

export const departmentApi = {
  create: (data) => api.post('/api/admin/departments', data),
  getById: (id) => api.get(`/api/admin/departments/${id}`),
  getAll: (params) => api.get('/api/admin/departments', { params }),
  getAllDropdown: () => api.get('/api/admin/departments/all'),
  update: (id, data) => api.put(`/api/admin/departments/${id}`, data),
  delete: (id) => api.delete(`/api/admin/departments/${id}`),
};
