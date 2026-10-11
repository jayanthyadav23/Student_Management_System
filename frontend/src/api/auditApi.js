import api from './client';

export const auditApi = {
  getRecent: () => api.get('/api/admin/audit-logs'),
};
