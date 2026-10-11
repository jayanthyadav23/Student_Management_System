package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryRequest;
import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryResponse;
import com.sms.studentmanagementsystem.service.TimetableService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    private final TimetableService timetableService;

    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TimetableEntryResponse>> createEntry(@Valid @RequestBody TimetableEntryRequest request) {
        TimetableEntryResponse response = timetableService.createEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Timetable slot created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<TimetableEntryResponse>>> getTimetable(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) Long courseId) {
        List<TimetableEntryResponse> response = timetableService.getTimetable(departmentId, semester, facultyId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Timetable retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TimetableEntryResponse>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody TimetableEntryRequest request) {
        TimetableEntryResponse response = timetableService.updateEntry(id, request);
        return ResponseEntity.ok(ApiResponse.success("Timetable slot updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable Long id) {
        timetableService.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.success("Timetable slot deleted successfully", null));
    }
}
