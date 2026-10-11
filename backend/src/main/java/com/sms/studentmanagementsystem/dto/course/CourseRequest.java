package com.sms.studentmanagementsystem.dto.course;

import jakarta.validation.constraints.*;

public record CourseRequest(
        @NotBlank(message = "Course code is required")
        @Size(min = 2, max = 20, message = "Course code must be between 2 and 20 characters")
        String code,

        @NotBlank(message = "Course title is required")
        @Size(min = 2, max = 150, message = "Course title must be between 2 and 150 characters")
        String title,

        @NotNull(message = "Credits are required")
        @Min(value = 1, message = "Credits must be at least 1")
        @Max(value = 10, message = "Credits cannot exceed 10")
        Integer credits,

        @NotNull(message = "Department ID is required")
        Long departmentId,

        Long facultyId,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be between 1 and 12")
        @Max(value = 12, message = "Semester must be between 1 and 12")
        Integer semester,

        String description,
        String academicYear,
        String status
) {}
