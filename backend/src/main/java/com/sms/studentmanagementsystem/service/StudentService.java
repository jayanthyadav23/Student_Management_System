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

    PageResponse<StudentResponse> getAllStudents(
            String search,
            Long departmentId,
            Integer semester,
            String academicYear,
            String section,
            Long courseId,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    default PageResponse<StudentResponse> getAllStudents(
            String search,
            Long departmentId,
            Integer semester,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        return getAllStudents(search, departmentId, semester, null, null, null, page, size, sortBy, sortDir);
    }

    StudentResponse updateStudent(Long id, StudentUpdateRequest request);

    void deleteStudent(Long id);

    List<EnrollmentResponse> getStudentEnrollments(Long studentId);

    EnrollmentResponse enrollStudent(EnrollmentRequest request);

    void unenrollStudent(Long studentId, Long courseId);

    StudentResponse toggleStudentStatus(Long id);

    List<StudentResponse> getAllStudentsList(
            String search,
            Long departmentId,
            Integer semester,
            String academicYear,
            String section,
            Long courseId
    );

    default List<StudentResponse> getAllStudentsList(String search, Long departmentId, Integer semester) {
        return getAllStudentsList(search, departmentId, semester, null, null, null);
    }
}
