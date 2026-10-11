package com.sms.studentmanagementsystem.dto.marks;

import com.sms.studentmanagementsystem.entity.ExamType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record BatchMarkEntryRequest(
        @NotNull(message = "Exam type is required")
        ExamType examType,

        @NotNull(message = "Default max score is required")
        @Positive(message = "Default max score must be greater than zero")
        Double defaultMaxScore,

        @NotEmpty(message = "Entries list cannot be empty")
        @Valid
        List<StudentMarkEntry> entries
) {}
