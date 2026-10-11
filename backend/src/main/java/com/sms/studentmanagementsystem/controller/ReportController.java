package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.report.CourseAttendanceReportResponse;
import com.sms.studentmanagementsystem.dto.report.CoursePerformanceResponse;
import com.sms.studentmanagementsystem.dto.report.CourseResultReportResponse;
import com.sms.studentmanagementsystem.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<CourseAttendanceReportResponse>> getAttendanceReport(
            @PathVariable Long courseId,
            @RequestParam(required = false, defaultValue = "false") Boolean below75Only,
            Authentication authentication) {
        CourseAttendanceReportResponse report = reportService.getAttendanceReport(courseId, below75Only, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course attendance report generated successfully", report));
    }

    @GetMapping("/courses/{courseId}/attendance/export")
    public ResponseEntity<byte[]> exportAttendanceReportCsv(
            @PathVariable Long courseId,
            @RequestParam(required = false, defaultValue = "false") Boolean below75Only,
            Authentication authentication) {
        byte[] csvData = reportService.exportAttendanceReportCsv(courseId, below75Only, authentication.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance_report_course_" + courseId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    @GetMapping("/courses/{courseId}/results")
    public ResponseEntity<ApiResponse<CourseResultReportResponse>> getResultsReport(
            @PathVariable Long courseId,
            Authentication authentication) {
        CourseResultReportResponse report = reportService.getResultsReport(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course results report generated successfully", report));
    }

    @GetMapping("/courses/{courseId}/results/export")
    public ResponseEntity<byte[]> exportResultsReportCsv(
            @PathVariable Long courseId,
            Authentication authentication) {
        byte[] csvData = reportService.exportResultsReportCsv(courseId, authentication.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"results_report_course_" + courseId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    @GetMapping("/courses/{courseId}/performance")
    public ResponseEntity<ApiResponse<CoursePerformanceResponse>> getCoursePerformance(
            @PathVariable Long courseId,
            Authentication authentication) {
        CoursePerformanceResponse report = reportService.getCoursePerformance(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course performance analytics generated successfully", report));
    }

    @GetMapping("/courses/{courseId}/performance/export")
    public ResponseEntity<byte[]> exportCoursePerformanceCsv(
            @PathVariable Long courseId,
            Authentication authentication) {
        byte[] csvData = reportService.exportCoursePerformanceCsv(courseId, authentication.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"performance_report_course_" + courseId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
