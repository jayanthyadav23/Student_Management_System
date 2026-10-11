package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.announcement.AnnouncementRequest;
import com.sms.studentmanagementsystem.dto.announcement.AnnouncementResponse;
import com.sms.studentmanagementsystem.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(@Valid @RequestBody AnnouncementRequest request) {
        AnnouncementResponse response = announcementService.createAnnouncement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement broadcasted successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAllAnnouncements(
            @RequestParam(required = false) String role) {
        List<AnnouncementResponse> response = announcementService.getAllAnnouncements(role);
        return ResponseEntity.ok(ApiResponse.success("Announcements retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> updateAnnouncement(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest request) {
        AnnouncementResponse response = announcementService.updateAnnouncement(id, request);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated successfully", response));
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> togglePin(@PathVariable Long id) {
        AnnouncementResponse response = announcementService.togglePin(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement pin status updated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }
}
