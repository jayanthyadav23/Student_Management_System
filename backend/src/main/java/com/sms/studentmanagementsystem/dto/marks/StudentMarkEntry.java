package com.sms.studentmanagementsystem.dto.marks;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StudentMarkEntry(
        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        Double score,

        Double marksObtained,

        Double maxScore,

        String remarks
) {
    public StudentMarkEntry(Long enrollmentId, Double score, Double maxScore) {
        this(enrollmentId, score, score, maxScore, "");
    }

    public StudentMarkEntry(Long enrollmentId, Double score, Double marksObtained, Double maxScore) {
        this(enrollmentId, score, marksObtained, maxScore, "");
    }

    public Double getEffectiveScore() {
        if (score != null) {
            return score;
        }
        if (marksObtained != null) {
            return marksObtained;
        }
        return 0.0;
    }
}
