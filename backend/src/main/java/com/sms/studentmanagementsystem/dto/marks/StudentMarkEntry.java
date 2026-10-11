package com.sms.studentmanagementsystem.dto.marks;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record StudentMarkEntry(
        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        @NotNull(message = "Score is required")
        @PositiveOrZero(message = "Score cannot be negative")
        Double score,

        Double maxScore
) {}
