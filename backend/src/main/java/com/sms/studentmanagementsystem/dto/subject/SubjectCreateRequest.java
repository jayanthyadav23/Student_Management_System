package com.sms.studentmanagementsystem.dto.subject;

import jakarta.validation.constraints.*;

public record SubjectCreateRequest(
        @NotBlank(message = "Subject code is required")
        @Size(min = 2, max = 30, message = "Subject code must be between 2 and 30 characters")
        String code,

        @NotBlank(message = "Subject name is required")
        @Size(min = 2, max = 150, message = "Subject name must be between 2 and 150 characters")
        String name,

        @NotNull(message = "Credits are required")
        @Min(value = 1, message = "Credits must be at least 1")
        @Max(value = 10, message = "Credits cannot exceed 10")
        Integer credits,

        String type, // THEORY, PRACTICAL, ELECTIVE

        @NotNull(message = "Department ID is required")
        Long departmentId,

        Long courseId, // Optional parent course

        Long facultyId, // Optional assigned faculty

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be between 1 and 12")
        @Max(value = 12, message = "Semester must be between 1 and 12")
        Integer semester
) {}
