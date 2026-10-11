package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.course.CourseAssignFacultyRequest;
import com.sms.studentmanagementsystem.dto.course.CourseRequest;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;

import java.util.List;

public interface CourseService {

    CourseResponse createCourse(CourseRequest request);

    CourseResponse getCourseById(Long id);

    PageResponse<CourseResponse> getAllCourses(String search, Long departmentId, Long facultyId, int page, int size, String sortBy, String sortDir);

    List<CourseResponse> getAllCoursesDropdown(Long departmentId);

    CourseResponse updateCourse(Long id, CourseRequest request);

    CourseResponse assignFacultyToCourse(Long courseId, CourseAssignFacultyRequest request);

    void deleteCourse(Long id);

    CourseResponse toggleCourseStatus(Long id);

    List<com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse> getCourseEnrollments(Long courseId);

    com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse enrollStudentToCourse(Long courseId, Long studentId);

    void removeStudentFromCourse(Long courseId, Long studentId);
}
