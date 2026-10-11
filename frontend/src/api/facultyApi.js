import api from './client';

export const facultyApi = {
  create: (data) => api.post('/api/admin/faculty', data),
  getById: (id) => api.get(`/api/admin/faculty/${id}`),
  getAll: (params) => api.get('/api/admin/faculty', { params }),
  getAllDropdown: (departmentId) =>
    api.get('/api/admin/faculty/all', { params: { departmentId } }),
  update: (id, data) => api.put(`/api/admin/faculty/${id}`, data),
  toggleStatus: (id) => api.patch(`/api/admin/faculty/${id}/toggle-status`),
  delete: (id) => api.delete(`/api/admin/faculty/${id}`),
};
