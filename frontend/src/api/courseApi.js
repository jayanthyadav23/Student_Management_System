import api from './client';

export const courseApi = {
  create: (data) => api.post('/api/admin/courses', data),
  getById: (id) => api.get(`/api/admin/courses/${id}`),
  getAll: (params) => api.get('/api/admin/courses', { params }),
  getAllDropdown: (departmentId) =>
    api.get('/api/admin/courses/all', { params: { departmentId } }),
  update: (id, data) => api.put(`/api/admin/courses/${id}`, data),
  toggleStatus: (id) => api.patch(`/api/admin/courses/${id}/toggle-status`),
  assignFaculty: (id, facultyId) =>
    api.patch(`/api/admin/courses/${id}/assign-faculty`, { facultyId }),
  getStudents: (id) => api.get(`/api/admin/courses/${id}/students`),
  enrollStudent: (id, studentId) => api.post(`/api/admin/courses/${id}/students/${studentId}`),
  removeStudent: (id, studentId) => api.delete(`/api/admin/courses/${id}/students/${studentId}`),
  delete: (id) => api.delete(`/api/admin/courses/${id}`),
};
