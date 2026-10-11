package com.sms.studentmanagementsystem.dto.attendance;

import java.time.LocalDate;
import java.util.List;

public record CourseAttendanceSummaryResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        LocalDate date,
        int totalEnrolled,
        int presentCount,
        int lateCount,
        int absentCount,
        List<AttendanceRecordResponse> records
) {}
