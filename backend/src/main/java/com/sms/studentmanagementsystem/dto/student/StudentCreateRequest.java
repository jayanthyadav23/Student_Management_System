package com.sms.studentmanagementsystem.dto.student;

import jakarta.validation.constraints.*;

public record StudentCreateRequest(
        @NotBlank(message = "Roll number is required")
        @Size(min = 2, max = 50, message = "Roll number must be between 2 and 50 characters")
        String rollNumber,

        @NotBlank(message = "Student name is required")
        @Size(min = 2, max = 100, message = "Student name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotNull(message = "Age is required")
        @Min(value = 1, message = "Age must be at least 1")
        @Max(value = 120, message = "Age cannot exceed 120")
        Integer age,

        @NotNull(message = "Department ID is required")
        Long departmentId,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be between 1 and 12")
        @Max(value = 12, message = "Semester must be between 1 and 12")
        Integer semester,

        String academicYear,
        String section,
        String status,
        String phone,
        String address
) {
    public StudentCreateRequest(String rollNumber, String name, String email, String password, Integer age, Long departmentId, Integer semester, String academicYear, String status, String phone, String address) {
        this(rollNumber, name, email, password, age, departmentId, semester, academicYear, "A", status, phone, address);
    }
}
