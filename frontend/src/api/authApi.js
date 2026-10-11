import api from './client';

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  getPublicDepartments: () => api.get('/api/auth/departments'),
};
