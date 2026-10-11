package com.sms.studentmanagementsystem.dto.attendance;

import com.sms.studentmanagementsystem.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public record StudentAttendanceEntry(
        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        @NotNull(message = "Attendance status is required")
        AttendanceStatus status
) {}
