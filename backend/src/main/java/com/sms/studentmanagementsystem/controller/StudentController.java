package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentRequest;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCreateRequest;
import com.sms.studentmanagementsystem.dto.student.StudentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentUpdateRequest;
import com.sms.studentmanagementsystem.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@PreAuthorize("hasRole('ADMIN')")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponse>> createStudent(
            @Valid @RequestBody StudentCreateRequest request) {
        StudentResponse created = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registered and login account created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StudentResponse>>> getAllStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<StudentResponse> students = studentService.getAllStudents(search, departmentId, semester, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Students retrieved successfully", students));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> getStudentById(@PathVariable Long id) {
        StudentResponse student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success("Student retrieved successfully", student));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentUpdateRequest request) {
        StudentResponse updated = studentService.updateStudent(id, request);
        return ResponseEntity.ok(ApiResponse.success("Student updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Student and login account deleted successfully", null));
    }

    @GetMapping("/{id}/enrollments")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getStudentEnrollments(@PathVariable Long id) {
        List<EnrollmentResponse> enrollments = studentService.getStudentEnrollments(id);
        return ResponseEntity.ok(ApiResponse.success("Student enrolled courses retrieved", enrollments));
    }

    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollStudent(
            @Valid @RequestBody EnrollmentRequest request) {
        EnrollmentResponse enrollment = studentService.enrollStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student enrolled in course successfully", enrollment));
    }

    @DeleteMapping("/{studentId}/courses/{courseId}")
    public ResponseEntity<ApiResponse<Void>> unenrollStudent(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        studentService.unenrollStudent(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Student unenrolled from course successfully", null));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<StudentResponse>> toggleStudentStatus(@PathVariable Long id) {
        StudentResponse response = studentService.toggleStudentStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Student status updated successfully", response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getAllStudentsList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer semester) {
        List<StudentResponse> list = studentService.getAllStudentsList(search, departmentId, semester);
        return ResponseEntity.ok(ApiResponse.success("All students list retrieved", list));
    }
}
