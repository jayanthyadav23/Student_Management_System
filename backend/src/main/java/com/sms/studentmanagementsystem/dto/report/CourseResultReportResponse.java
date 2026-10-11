package com.sms.studentmanagementsystem.dto.report;

import java.util.List;

public record CourseResultReportResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        String facultyName,
        int totalEnrolled,
        int gradedStudents,
        Double classAveragePercentage,
        Double highestPercentage,
        String topperName,
        String topperRollNumber,
        Double passRate,
        List<StudentResultReportItem> students
) {}
