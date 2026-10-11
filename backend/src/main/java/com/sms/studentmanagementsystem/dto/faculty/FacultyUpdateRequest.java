package com.sms.studentmanagementsystem.dto.faculty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FacultyUpdateRequest(
        @NotBlank(message = "Faculty name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Designation is required")
        @Size(min = 2, max = 100, message = "Designation must be between 2 and 100 characters")
        String designation,

        @NotNull(message = "Department ID is required")
        Long departmentId
) {}
