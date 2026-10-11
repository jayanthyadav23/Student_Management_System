package com.sms.studentmanagementsystem.dto.student;

import java.util.List;

public record StudentOverallResultResponse(
        Long studentId,
        String rollNumber,
        String studentName,
        Double overallScoreObtained,
        Double overallMaxScore,
        Double overallPercentage,
        String overallGrade,
        String overallStatus,
        int totalCourses,
        int passedCourses,
        int failedCourses,
        List<StudentCourseResultResponse> courseResults
) {}
