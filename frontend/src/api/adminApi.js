import api from './client';

export const adminApi = {
  getDashboardStats: () => api.get('/api/admin/dashboard'),
  toggleUserStatus: (userId, enabled) =>
    api.patch(`/api/admin/users/${userId}/status`, { enabled }),
  resetUserPassword: (userId, newPassword) =>
    api.post(`/api/admin/users/${userId}/reset-password`, { newPassword }),
};
