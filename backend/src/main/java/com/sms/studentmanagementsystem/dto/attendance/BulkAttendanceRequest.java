package com.sms.studentmanagementsystem.dto.attendance;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BulkAttendanceRequest(
        @NotNull(message = "Attendance date is required")
        LocalDate date,

        @NotEmpty(message = "Attendance entries list cannot be empty")
        @Valid
        List<StudentAttendanceEntry> entries
) {}
