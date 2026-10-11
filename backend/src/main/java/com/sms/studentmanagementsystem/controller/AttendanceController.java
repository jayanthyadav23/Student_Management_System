package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.attendance.BulkAttendanceRequest;
import com.sms.studentmanagementsystem.dto.attendance.CourseAttendanceSummaryResponse;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAssignedCourses(Authentication authentication) {
        List<CourseResponse> courses = attendanceService.getFacultyCourses(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assigned courses retrieved successfully", courses));
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrolledStudents(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<EnrollmentResponse> students = attendanceService.getCourseEnrolledStudents(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Enrolled students retrieved successfully", students));
    }

    @GetMapping("/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<CourseAttendanceSummaryResponse>> getAttendanceSheet(
            @PathVariable Long courseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        CourseAttendanceSummaryResponse sheet = attendanceService.getAttendanceSheetForDate(courseId, targetDate, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Attendance sheet retrieved successfully", sheet));
    }

    @PostMapping("/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<CourseAttendanceSummaryResponse>> markAttendance(
            @PathVariable Long courseId,
            @Valid @RequestBody BulkAttendanceRequest request,
            Authentication authentication) {
        CourseAttendanceSummaryResponse updated = attendanceService.markBulkAttendance(courseId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Attendance recorded successfully", updated));
    }

    @GetMapping("/courses/{courseId}/attendance/history")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getAttendanceDates(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<LocalDate> dates = attendanceService.getCourseAttendanceDates(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Past attendance session dates retrieved", dates));
    }
}
