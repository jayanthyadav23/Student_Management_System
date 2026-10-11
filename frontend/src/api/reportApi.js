import api from './client';
import axios from 'axios';

export const reportApi = {
  getAttendanceReport: (courseId, below75Only) =>
    api.get(`/api/reports/courses/${courseId}/attendance`, { params: { below75Only } }),

  getResultsReport: (courseId) =>
    api.get(`/api/reports/courses/${courseId}/results`),

  getPerformanceReport: (courseId) =>
    api.get(`/api/reports/courses/${courseId}/performance`),

  // File download helpers (Blob download)
  downloadCsv: async (url, filename) => {
    const token = localStorage.getItem('sms_token');
    const response = await axios.get(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportAttendanceCsv: (courseId, below75Only = false) =>
    reportApi.downloadCsv(
      `/api/reports/courses/${courseId}/attendance/export?below75Only=${below75Only}`,
      `attendance_course_${courseId}.csv`
    ),

  exportResultsCsv: (courseId) =>
    reportApi.downloadCsv(
      `/api/reports/courses/${courseId}/results/export`,
      `results_course_${courseId}.csv`
    ),

  exportPerformanceCsv: (courseId) =>
    reportApi.downloadCsv(
      `/api/reports/courses/${courseId}/performance/export`,
      `performance_course_${courseId}.csv`
    ),
};
