package com.sms.studentmanagementsystem.dto.auth;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String email,
        String name,
        String role
) {
    public static AuthResponse of(String token, Long userId, String email, String name, String role) {
        return new AuthResponse(token, "Bearer", userId, email, name, role);
    }
}
