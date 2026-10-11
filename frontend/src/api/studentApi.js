import api from './client';

export const studentApi = {
  // Admin endpoints
  create: (data) => api.post('/api/admin/students', data),
  getById: (id) => api.get(`/api/admin/students/${id}`),
  getAll: (params) => api.get('/api/admin/students', { params }),
  update: (id, data) => api.put(`/api/admin/students/${id}`, data),
  delete: (id) => api.delete(`/api/admin/students/${id}`),
  getEnrollments: (studentId) => api.get(`/api/admin/students/${studentId}/enrollments`),
  enroll: (data) => api.post('/api/admin/students/enroll', data),
  unenroll: (studentId, courseId) => api.delete(`/api/admin/students/${studentId}/courses/${courseId}`),
  toggleStatus: (id) => api.patch(`/api/admin/students/${id}/toggle-status`),
  getAllList: (params) => api.get('/api/admin/students/all', { params }),

  // Student self-service endpoints
  getMyProfile: () => api.get('/api/student/profile'),
  getMyCourses: () => api.get('/api/student/courses'),
  getMyAttendance: () => api.get('/api/student/attendance'),
  getMyCourseAttendance: (courseId) => api.get(`/api/student/attendance/course/${courseId}`),
  getMyResults: () => api.get('/api/student/results'),
};
