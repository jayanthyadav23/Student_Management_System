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
        AttendanceStatus status,
        String remarks,
        Double attendancePercentage,
        Integer totalSessions,
        Integer attendedSessions
) {
    public AttendanceRecordResponse(Long attendanceId, Long enrollmentId, Long studentId, String rollNumber, String studentName, LocalDate date, AttendanceStatus status, String remarks) {
        this(attendanceId, enrollmentId, studentId, rollNumber, studentName, date, status, remarks, 100.0, 0, 0);
    }

    public AttendanceRecordResponse(Long attendanceId, Long enrollmentId, Long studentId, String rollNumber, String studentName, LocalDate date, AttendanceStatus status) {
        this(attendanceId, enrollmentId, studentId, rollNumber, studentName, date, status, "", 100.0, 0, 0);
    }
}
