package com.sms.studentmanagementsystem.dto.attendance;

import com.sms.studentmanagementsystem.entity.AttendanceStatus;

import java.time.LocalDate;

public record AttendanceRecordResponse(
        Long attendanceId,
        Long enrollmentId,
        Long studentId,
        String rollNumber,
        String studentName,
        LocalDate date,
        AttendanceStatus status
) {}
