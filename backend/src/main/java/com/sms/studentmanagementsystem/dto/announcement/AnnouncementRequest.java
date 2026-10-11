package com.sms.studentmanagementsystem.dto.announcement;

import jakarta.validation.constraints.*;

public record AnnouncementRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        String title,

        @NotBlank(message = "Content is required")
        @Size(max = 3000, message = "Content cannot exceed 3000 characters")
        String content,

        String targetRole, // ALL, STUDENT, FACULTY
        String category,   // ACADEMIC, EXAM, EVENT, GENERAL
        Long departmentId, // null for college-wide
        Boolean pinned
) {}
