package com.sms.studentmanagementsystem.dto.report;

public record StudentAttendanceReportItem(
        Long studentId,
        String rollNumber,
        String studentName,
        String departmentName,
        int totalClasses,
        int attendedClasses,
        Double percentage,
        boolean isBelow75
) {}
