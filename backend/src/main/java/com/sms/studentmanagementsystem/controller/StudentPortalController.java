package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCourseAttendanceResponse;
import com.sms.studentmanagementsystem.dto.student.StudentOverallResultResponse;
import com.sms.studentmanagementsystem.dto.student.StudentProfileResponse;
import com.sms.studentmanagementsystem.service.StudentPortalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentPortalController {

    private final StudentPortalService studentPortalService;

    public StudentPortalController(StudentPortalService studentPortalService) {
        this.studentPortalService = studentPortalService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getMyProfile(Authentication authentication) {
        StudentProfileResponse profile = studentPortalService.getMyProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Student profile retrieved successfully", profile));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyCourses(Authentication authentication) {
        List<EnrollmentResponse> courses = studentPortalService.getMyCourses(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Enrolled courses retrieved successfully", courses));
    }

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<StudentCourseAttendanceResponse>>> getMyAttendance(Authentication authentication) {
        List<StudentCourseAttendanceResponse> attendanceList = studentPortalService.getMyAttendance(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course attendance records retrieved successfully", attendanceList));
    }

    @GetMapping("/attendance/course/{courseId}")
    public ResponseEntity<ApiResponse<StudentCourseAttendanceResponse>> getMyCourseAttendance(
            @PathVariable Long courseId,
            Authentication authentication) {
        StudentCourseAttendanceResponse attendance = studentPortalService.getMyCourseAttendance(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course attendance details retrieved successfully", attendance));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<StudentOverallResultResponse>> getMyResults(Authentication authentication) {
        StudentOverallResultResponse results = studentPortalService.getMyResults(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Academic results and grades computed successfully", results));
    }
}
