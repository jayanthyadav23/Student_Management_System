package com.sms.studentmanagementsystem.dto.report;

public record StudentResultReportItem(
        Long studentId,
        String rollNumber,
        String studentName,
        Double totalScore,
        Double maxScore,
        Double percentage,
        String grade,
        String status
) {}
