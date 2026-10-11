package com.sms.studentmanagementsystem.dto.announcement;

import java.time.Instant;

public record AnnouncementResponse(
        Long id,
        String title,
        String content,
        String targetRole,
        String category,
        Long departmentId,
        String departmentName,
        String authorName,
        boolean pinned,
        Instant createdAt
) {}
