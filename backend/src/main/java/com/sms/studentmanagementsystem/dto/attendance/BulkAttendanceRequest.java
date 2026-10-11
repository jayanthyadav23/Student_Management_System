package com.sms.studentmanagementsystem.dto.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;
import java.util.List;

public record BulkAttendanceRequest(
        @NotNull(message = "Attendance date is required")
        @PastOrPresent(message = "Attendance date cannot be in the future")
        LocalDate date,

        @NotEmpty(message = "Attendance entries list cannot be empty")
        @Valid
        List<StudentAttendanceEntry> entries
) {}
