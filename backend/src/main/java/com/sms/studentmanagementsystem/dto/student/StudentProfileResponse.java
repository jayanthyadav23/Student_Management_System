package com.sms.studentmanagementsystem.dto.student;

import java.time.LocalDate;

public record StudentProfileResponse(
        Long studentId,
        Long userId,
        String rollNumber,
        String name,
        String email,
        Integer age,
        Long departmentId,
        String departmentName,
        String departmentCode,
        Integer semester,
        LocalDate enrollmentDate,
        int totalEnrolledCourses,
        Double overallAttendancePercentage,
        boolean hasAttendanceWarning
) {}
