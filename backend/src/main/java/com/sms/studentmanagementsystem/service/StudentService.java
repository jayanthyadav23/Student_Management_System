package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentRequest;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCreateRequest;
import com.sms.studentmanagementsystem.dto.student.StudentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentUpdateRequest;

import java.util.List;

public interface StudentService {

    StudentResponse createStudent(StudentCreateRequest request);

    StudentResponse getStudentById(Long id);

    PageResponse<StudentResponse> getAllStudents(String search, Long departmentId, Integer semester, int page, int size, String sortBy, String sortDir);

    StudentResponse updateStudent(Long id, StudentUpdateRequest request);

    void deleteStudent(Long id);

    List<EnrollmentResponse> getStudentEnrollments(Long studentId);

    EnrollmentResponse enrollStudent(EnrollmentRequest request);

    void unenrollStudent(Long studentId, Long courseId);
}
