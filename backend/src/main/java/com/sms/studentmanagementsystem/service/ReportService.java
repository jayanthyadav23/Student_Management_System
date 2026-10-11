package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.report.CourseAttendanceReportResponse;
import com.sms.studentmanagementsystem.dto.report.CoursePerformanceResponse;
import com.sms.studentmanagementsystem.dto.report.CourseResultReportResponse;

public interface ReportService {

    CourseAttendanceReportResponse getAttendanceReport(Long courseId, Boolean below75Only, String userEmail);

    CourseResultReportResponse getResultsReport(Long courseId, String userEmail);

    CoursePerformanceResponse getCoursePerformance(Long courseId, String userEmail);

    byte[] exportAttendanceReportCsv(Long courseId, Boolean below75Only, String userEmail);

    byte[] exportResultsReportCsv(Long courseId, String userEmail);

    byte[] exportCoursePerformanceCsv(Long courseId, String userEmail);
}
