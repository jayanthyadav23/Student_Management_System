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
        String academicYear,
        String status,
        String phone,
        String address,
        LocalDate enrollmentDate,
        boolean enabled,
        int enrolledCoursesCount
) {
    public StudentResponse(Long id, Long userId, String rollNumber, String name, String email, Integer age, Long departmentId, String departmentName, String departmentCode, Integer semester, LocalDate enrollmentDate, boolean enabled, int enrolledCoursesCount) {
        this(id, userId, rollNumber, name, email, age, departmentId, departmentName, departmentCode, semester, "2025-2026", "ACTIVE", null, null, enrollmentDate, enabled, enrolledCoursesCount);
    }
}

