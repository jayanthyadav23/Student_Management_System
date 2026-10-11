package com.sms.studentmanagementsystem.dto.auth;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email,

        String rollNumber,

        Long departmentId,

        @Min(value = 1, message = "Semester must be between 1 and 12")
        @Max(value = 12, message = "Semester must be between 1 and 12")
        Integer semester,

        @Min(value = 16, message = "Age must be at least 16")
        @Max(value = 100, message = "Age cannot exceed 100")
        Integer age,

        String designation,

        String role,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password
) {
    public RegisterRequest(String name, String email, String rollNumber, Long departmentId, Integer semester, Integer age, String password) {
        this(name, email, rollNumber, departmentId, semester, age, null, "STUDENT", password);
    }
}
