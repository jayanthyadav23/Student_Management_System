package com.sms.studentmanagementsystem.dto.marks;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sms.studentmanagementsystem.entity.ExamType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MarkEntryRequest(
        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        @NotNull(message = "Exam type is required")
        ExamType examType,

        @NotNull(message = "Score is required")
        @PositiveOrZero(message = "Score cannot be negative")
        Double score,

        @NotNull(message = "Max score is required")
        @Positive(message = "Max score must be greater than zero")
        Double maxScore,

        String remarks
) {
    public MarkEntryRequest(Long enrollmentId, ExamType examType, Double score, Double maxScore) {
        this(enrollmentId, examType, score, maxScore, "");
    }
}
