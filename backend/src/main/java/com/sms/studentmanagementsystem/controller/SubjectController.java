package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectCreateRequest;
import com.sms.studentmanagementsystem.dto.subject.SubjectResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectUpdateRequest;
import com.sms.studentmanagementsystem.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(@Valid @RequestBody SubjectCreateRequest request) {
        SubjectResponse response = subjectService.createSubject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subject created successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(@PathVariable Long id) {
        SubjectResponse response = subjectService.getSubjectById(id);
        return ResponseEntity.ok(ApiResponse.success("Subject retrieved successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAllSubjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) Integer semester) {
        List<SubjectResponse> response = subjectService.getAllSubjects(search, departmentId, courseId, facultyId, semester);
        return ResponseEntity.ok(ApiResponse.success("Subjects retrieved successfully", response));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<PageResponse<SubjectResponse>>> getAllSubjectsPaged(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<SubjectResponse> response = subjectService.getAllSubjectsPaged(search, departmentId, courseId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Paged subjects retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectUpdateRequest request) {
        SubjectResponse response = subjectService.updateSubject(id, request);
        return ResponseEntity.ok(ApiResponse.success("Subject updated successfully", response));
    }

    @PatchMapping("/{id}/assign-faculty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> assignFaculty(
            @PathVariable Long id,
            @RequestParam(required = false) Long facultyId) {
        SubjectResponse response = subjectService.assignFacultyToSubject(id, facultyId);
        return ResponseEntity.ok(ApiResponse.success("Faculty assignment updated", response));
    }

    @PatchMapping("/{id}/assign-course")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> assignCourse(
            @PathVariable Long id,
            @RequestParam(required = false) Long courseId) {
        SubjectResponse response = subjectService.assignCourseToSubject(id, courseId);
        return ResponseEntity.ok(ApiResponse.success("Course assignment updated", response));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> toggleStatus(@PathVariable Long id) {
        SubjectResponse response = subjectService.toggleSubjectStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Subject status updated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted successfully", null));
    }
}
