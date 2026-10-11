package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.admin.DashboardStatsResponse;

public interface AdminService {

    void toggleUserAccountStatus(Long userId, boolean enabled);

    void resetUserPassword(Long userId, String newPassword);

    DashboardStatsResponse getDashboardStats();
}
