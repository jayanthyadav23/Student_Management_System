import api from './client';

export const courseApi = {
  create: (data) => api.post('/api/admin/courses', data),
  getById: (id) => api.get(`/api/admin/courses/${id}`),
  getAll: (params) => api.get('/api/admin/courses', { params }),
  getAllDropdown: (departmentId) =>
    api.get('/api/admin/courses/all', { params: { departmentId } }),
  update: (id, data) => api.put(`/api/admin/courses/${id}`, data),
  assignFaculty: (id, facultyId) =>
    api.patch(`/api/admin/courses/${id}/assign-faculty`, { facultyId }),
  delete: (id) => api.delete(`/api/admin/courses/${id}`),
};
