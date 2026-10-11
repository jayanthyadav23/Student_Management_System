package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCourseAttendanceResponse;
import com.sms.studentmanagementsystem.dto.student.StudentOverallResultResponse;
import com.sms.studentmanagementsystem.dto.student.StudentProfileResponse;

import java.util.List;

public interface StudentPortalService {

    StudentProfileResponse getMyProfile(String userEmail);

    List<EnrollmentResponse> getMyCourses(String userEmail);

    List<StudentCourseAttendanceResponse> getMyAttendance(String userEmail);

    StudentCourseAttendanceResponse getMyCourseAttendance(Long courseId, String userEmail);

    StudentOverallResultResponse getMyResults(String userEmail);
}
