package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.attendance.BulkAttendanceRequest;
import com.sms.studentmanagementsystem.dto.attendance.CourseAttendanceSummaryResponse;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    List<CourseResponse> getFacultyCourses(String userEmail);

    List<EnrollmentResponse> getCourseEnrolledStudents(Long courseId, String userEmail);

    CourseAttendanceSummaryResponse getAttendanceSheetForDate(Long courseId, LocalDate date, String userEmail);

    CourseAttendanceSummaryResponse markBulkAttendance(Long courseId, BulkAttendanceRequest request, String userEmail);

    List<LocalDate> getCourseAttendanceDates(Long courseId, String userEmail);
}
