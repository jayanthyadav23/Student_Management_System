package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.course.CourseAssignFacultyRequest;
import com.sms.studentmanagementsystem.dto.course.CourseRequest;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;
import com.sms.studentmanagementsystem.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request) {
        CourseResponse created = courseService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getAllCourses(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<CourseResponse> courses = courseService.getAllCourses(search, departmentId, facultyId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved successfully", courses));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCoursesDropdown(
            @RequestParam(required = false) Long departmentId) {
        List<CourseResponse> list = courseService.getAllCoursesDropdown(departmentId);
        return ResponseEntity.ok(ApiResponse.success("All courses retrieved", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable Long id) {
        CourseResponse course = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success("Course retrieved successfully", course));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request) {
        CourseResponse updated = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", updated));
    }

    @RequestMapping(value = "/{id}/assign-faculty", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<CourseResponse>> assignFaculty(
            @PathVariable Long id,
            @RequestBody CourseAssignFacultyRequest request) {
        CourseResponse updated = courseService.assignFacultyToCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Faculty assigned to course successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully", null));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<CourseResponse>> toggleCourseStatus(@PathVariable Long id) {
        CourseResponse response = courseService.toggleCourseStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Course status updated successfully", response));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse>>> getCourseEnrollments(@PathVariable Long id) {
        List<com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse> list = courseService.getCourseEnrollments(id);
        return ResponseEntity.ok(ApiResponse.success("Course enrolled students retrieved", list));
    }

    @PostMapping("/{id}/students/{studentId}")
    public ResponseEntity<ApiResponse<com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse>> enrollStudentToCourse(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse response = courseService.enrollStudentToCourse(id, studentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student enrolled in course", response));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudentFromCourse(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        courseService.removeStudentFromCourse(id, studentId);
        return ResponseEntity.ok(ApiResponse.success("Student removed from course", null));
    }
}
