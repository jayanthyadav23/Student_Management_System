package com.sms.studentmanagementsystem.dto.auth;

public record UserSummaryResponse(
        Long id,
        String email,
        String name,
        String role,
        boolean enabled,
        Long profileId
) {}
