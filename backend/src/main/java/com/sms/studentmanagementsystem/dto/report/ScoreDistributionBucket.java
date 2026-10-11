package com.sms.studentmanagementsystem.dto.report;

public record ScoreDistributionBucket(
        String gradeLabel,
        String scoreRange,
        int count,
        Double percentageOfClass
) {}
