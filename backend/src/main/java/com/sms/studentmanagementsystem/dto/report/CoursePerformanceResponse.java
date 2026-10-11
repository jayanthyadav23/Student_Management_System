package com.sms.studentmanagementsystem.dto.report;

import java.util.List;

public record CoursePerformanceResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        String facultyName,
        int totalEnrolled,
        int evaluatedStudents,
        Double averagePercentage,
        Double passRate,
        List<ScoreDistributionBucket> distributionBuckets
) {}
