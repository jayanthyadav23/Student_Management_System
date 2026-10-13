package com.sms.studentmanagementsystem.dto.marks;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sms.studentmanagementsystem.entity.ExamType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BatchMarkEntryRequest(
        @NotNull(message = "Exam type is required")
        ExamType examType,

        Double defaultMaxScore,

        Double maxMarks,

        @NotEmpty(message = "Entries list cannot be empty")
        @Valid
        List<StudentMarkEntry> entries
) {
    public BatchMarkEntryRequest(ExamType examType, Double defaultMaxScore, List<StudentMarkEntry> entries) {
        this(examType, defaultMaxScore, defaultMaxScore, entries);
    }

    public Double getEffectiveMaxScore() {
        if (defaultMaxScore != null && defaultMaxScore > 0) {
            return defaultMaxScore;
        }
        if (maxMarks != null && maxMarks > 0) {
            return maxMarks;
        }
        return 100.0;
    }
}
