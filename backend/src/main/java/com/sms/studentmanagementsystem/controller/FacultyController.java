package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyCreateRequest;
import com.sms.studentmanagementsystem.dto.faculty.FacultyResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyUpdateRequest;
import com.sms.studentmanagementsystem.service.FacultyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/faculty")
@PreAuthorize("hasRole('ADMIN')")
public class FacultyController {

    private final FacultyService facultyService;

    public FacultyController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FacultyResponse>> createFaculty(
            @Valid @RequestBody FacultyCreateRequest request) {
        FacultyResponse created = facultyService.createFaculty(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Faculty member created and login account provisioned successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FacultyResponse>>> getAllFaculty(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<FacultyResponse> faculty = facultyService.getAllFaculty(search, departmentId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Faculty members retrieved successfully", faculty));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FacultyResponse>>> getAllFacultyDropdown(
            @RequestParam(required = false) Long departmentId) {
        List<FacultyResponse> list = facultyService.getAllFacultyDropdown(departmentId);
        return ResponseEntity.ok(ApiResponse.success("All faculty members retrieved", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyResponse>> getFacultyById(@PathVariable Long id) {
        FacultyResponse faculty = facultyService.getFacultyById(id);
        return ResponseEntity.ok(ApiResponse.success("Faculty member retrieved successfully", faculty));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyResponse>> updateFaculty(
            @PathVariable Long id,
            @Valid @RequestBody FacultyUpdateRequest request) {
        FacultyResponse updated = facultyService.updateFaculty(id, request);
        return ResponseEntity.ok(ApiResponse.success("Faculty member updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(@PathVariable Long id) {
        facultyService.deleteFaculty(id);
        return ResponseEntity.ok(ApiResponse.success("Faculty member and associated login account deleted successfully", null));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<FacultyResponse>> toggleFacultyStatus(@PathVariable Long id) {
        FacultyResponse response = facultyService.toggleFacultyStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Faculty status updated successfully", response));
    }
}
