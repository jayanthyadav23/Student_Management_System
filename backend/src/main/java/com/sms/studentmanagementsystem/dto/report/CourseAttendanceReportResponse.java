package com.sms.studentmanagementsystem.dto.report;

import java.util.List;

public record CourseAttendanceReportResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        String facultyName,
        int totalEnrolled,
        Double courseAverageAttendance,
        int studentsBelow75Count,
        List<StudentAttendanceReportItem> students
) {}
