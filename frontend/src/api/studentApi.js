import api from './client';

export const studentApi = {
  // Common / Shared student endpoints (accessible to ADMIN and FACULTY)
  create: (data) => api.post('/api/students', data),
  getById: (id) => api.get(`/api/students/${id}`),
  getAll: (params) => api.get('/api/students', { params }),
  getAllStudents: (params) => api.get('/api/students', { params }),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
  getEnrollments: (studentId) => api.get(`/api/students/${studentId}/enrollments`),
  enroll: (data) => api.post('/api/students/enroll', data),
  enrollStudent: (data) => api.post('/api/students/enroll', data),
  unenroll: (studentId, courseId) => api.delete(`/api/students/${studentId}/courses/${courseId}`),
  toggleStatus: (id) => api.patch(`/api/students/${id}/toggle-status`),
  getAllList: (params) => api.get('/api/students/all', { params }),
  getAllStudentsList: (params) => api.get('/api/students/all', { params }),

  // Student self-service endpoints
  getMyProfile: () => api.get('/api/student/profile'),
  getMyCourses: () => api.get('/api/student/courses'),
  getMyAttendance: () => api.get('/api/student/attendance'),
  getMyCourseAttendance: (courseId) => api.get(`/api/student/attendance/course/${courseId}`),
  getMyResults: () => api.get('/api/student/results'),
};
