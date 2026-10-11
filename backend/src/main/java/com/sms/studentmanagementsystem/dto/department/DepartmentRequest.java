package com.sms.studentmanagementsystem.dto.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentRequest(
        @NotBlank(message = "Department name is required")
        @Size(min = 2, max = 100, message = "Department name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Department code is required")
        @Size(min = 2, max = 20, message = "Department code must be between 2 and 20 characters")
        String code
) {}
