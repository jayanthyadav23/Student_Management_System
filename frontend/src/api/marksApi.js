import api from './client';

export const marksApi = {
  getCourseMarksSheet: (courseId, examType) =>
    api.get(`/api/faculty/courses/${courseId}/marks`, { params: { examType } }),
  recordMark: (courseId, data) =>
    api.post(`/api/faculty/courses/${courseId}/marks`, data),
  recordBatchMarks: (courseId, data) =>
    api.post(`/api/faculty/courses/${courseId}/marks/batch`, data),
  getEnrollmentMarks: (enrollmentId) =>
    api.get(`/api/faculty/enrollments/${enrollmentId}/marks`),
};
