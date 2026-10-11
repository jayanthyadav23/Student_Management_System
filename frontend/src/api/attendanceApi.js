import api from './client';

export const attendanceApi = {
  getAssignedCourses: () => api.get('/api/faculty/courses'),
  getCourseStudents: (courseId) => api.get(`/api/faculty/courses/${courseId}/students`),
  getAttendanceSheet: (courseId, date) =>
    api.get(`/api/faculty/courses/${courseId}/attendance`, { params: { date } }),
  markBulkAttendance: (courseId, data) =>
    api.post(`/api/faculty/courses/${courseId}/attendance`, data),
  getAttendanceHistory: (courseId) =>
    api.get(`/api/faculty/courses/${courseId}/attendance/history`),
};
