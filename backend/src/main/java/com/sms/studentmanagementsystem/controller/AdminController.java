package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.admin.AccountStatusRequest;
import com.sms.studentmanagementsystem.dto.admin.DashboardStatsResponse;
import com.sms.studentmanagementsystem.dto.admin.PasswordResetRequest;
import com.sms.studentmanagementsystem.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard analytics retrieved successfully", stats));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> toggleAccountStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AccountStatusRequest request) {
        adminService.toggleUserAccountStatus(userId, request.enabled());
        String status = request.enabled() ? "enabled" : "disabled";
        return ResponseEntity.ok(ApiResponse.success("User account " + status + " successfully", null));
    }

    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long userId,
            @Valid @RequestBody PasswordResetRequest request) {
        adminService.resetUserPassword(userId, request.newPassword());
        return ResponseEntity.ok(ApiResponse.success("User password reset successfully", null));
    }
}
