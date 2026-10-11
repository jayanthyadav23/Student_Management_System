import api from './client';

export const timetableApi = {
  create: (data) => api.post('/api/timetable', data),
  getAll: (params) => api.get('/api/timetable', { params }),
  update: (id, data) => api.put(`/api/timetable/${id}`, data),
  delete: (id) => api.delete(`/api/timetable/${id}`),
};
