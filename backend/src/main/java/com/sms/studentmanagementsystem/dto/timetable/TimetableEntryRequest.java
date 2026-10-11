package com.sms.studentmanagementsystem.dto.timetable;

import jakarta.validation.constraints.*;

public record TimetableEntryRequest(
        @NotBlank(message = "Day of week is required")
        String dayOfWeek,

        @NotBlank(message = "Start time is required")
        String startTime,

        @NotBlank(message = "End time is required")
        String endTime,

        String roomNumber,

        @NotNull(message = "Department ID is required")
        Long departmentId,

        @NotNull(message = "Semester is required")
        Integer semester,

        Long courseId,
        Long subjectId,
        Long facultyId
) {}
