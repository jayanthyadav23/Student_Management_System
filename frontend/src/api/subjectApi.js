import api from './client';

export const subjectApi = {
  create: (data) => api.post('/api/subjects', data),
  getById: (id) => api.get(`/api/subjects/${id}`),
  getAll: (params) => api.get('/api/subjects', { params }),
  getAllPaged: (params) => api.get('/api/subjects/paged', { params }),
  update: (id, data) => api.put(`/api/subjects/${id}`, data),
  assignFaculty: (id, facultyId) =>
    api.patch(`/api/subjects/${id}/assign-faculty`, null, { params: { facultyId } }),
  assignCourse: (id, courseId) =>
    api.patch(`/api/subjects/${id}/assign-course`, null, { params: { courseId } }),
  toggleStatus: (id) => api.patch(`/api/subjects/${id}/toggle-status`),
  delete: (id) => api.delete(`/api/subjects/${id}`),
};
