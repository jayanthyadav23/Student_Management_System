package com.sms.studentmanagementsystem.dto.student;

import com.sms.studentmanagementsystem.dto.attendance.AttendanceRecordResponse;

import java.util.List;

public record StudentCourseAttendanceResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        Integer credits,
        String facultyName,
        int totalClasses,
        int presentClasses,
        int lateClasses,
        int absentClasses,
        Double attendancePercentage,
        boolean lowAttendanceWarning,
        List<AttendanceRecordResponse> records
) {}
