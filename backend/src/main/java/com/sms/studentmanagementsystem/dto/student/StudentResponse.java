package com.sms.studentmanagementsystem.dto.student;

import java.time.LocalDate;

public record StudentResponse(
        Long id,
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
        boolean enabled,
        int enrolledCoursesCount
) {}
