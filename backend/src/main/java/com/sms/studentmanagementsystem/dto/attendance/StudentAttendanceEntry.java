package com.sms.studentmanagementsystem.dto.attendance;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sms.studentmanagementsystem.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StudentAttendanceEntry(
        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        @NotNull(message = "Attendance status is required")
        AttendanceStatus status,

        String remarks
) {
    public StudentAttendanceEntry(Long enrollmentId, AttendanceStatus status) {
        this(enrollmentId, status, "");
    }
}
