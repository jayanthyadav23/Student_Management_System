import api from './client';

export const announcementApi = {
  create: (data) => api.post('/api/announcements', data),
  getAll: (params) => api.get('/api/announcements', { params }),
  update: (id, data) => api.put(`/api/announcements/${id}`, data),
  togglePin: (id) => api.patch(`/api/announcements/${id}/pin`),
  delete: (id) => api.delete(`/api/announcements/${id}`),
};
