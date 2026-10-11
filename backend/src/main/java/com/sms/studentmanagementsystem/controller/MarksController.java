package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.marks.BatchMarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.CourseMarksSheetResponse;
import com.sms.studentmanagementsystem.dto.marks.MarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.MarkResponse;
import com.sms.studentmanagementsystem.entity.ExamType;
import com.sms.studentmanagementsystem.service.MarksService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
public class MarksController {

    private final MarksService marksService;

    public MarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @GetMapping("/courses/{courseId}/marks")
    public ResponseEntity<ApiResponse<CourseMarksSheetResponse>> getCourseMarksSheet(
            @PathVariable Long courseId,
            @RequestParam(required = false, defaultValue = "INTERNAL") ExamType examType,
            Authentication authentication) {
        CourseMarksSheetResponse sheet = marksService.getCourseMarksSheet(courseId, examType, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course marks sheet retrieved successfully", sheet));
    }

    @PostMapping("/courses/{courseId}/marks")
    public ResponseEntity<ApiResponse<MarkResponse>> recordOrUpdateMark(
            @PathVariable Long courseId,
            @Valid @RequestBody MarkEntryRequest request,
            Authentication authentication) {
        MarkResponse response = marksService.recordOrUpdateMark(courseId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Student mark recorded successfully", response));
    }

    @PostMapping("/courses/{courseId}/marks/batch")
    public ResponseEntity<ApiResponse<CourseMarksSheetResponse>> recordBatchMarks(
            @PathVariable Long courseId,
            @Valid @RequestBody BatchMarkEntryRequest request,
            Authentication authentication) {
        CourseMarksSheetResponse response = marksService.recordBatchMarks(courseId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Class marks recorded successfully", response));
    }

    @GetMapping("/enrollments/{enrollmentId}/marks")
    public ResponseEntity<ApiResponse<List<MarkResponse>>> getMarksByEnrollment(
            @PathVariable Long enrollmentId,
            Authentication authentication) {
        List<MarkResponse> marks = marksService.getMarksByEnrollment(enrollmentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Enrollment marks retrieved successfully", marks));
    }
}
