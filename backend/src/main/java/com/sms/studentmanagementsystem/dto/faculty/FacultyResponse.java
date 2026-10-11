package com.sms.studentmanagementsystem.dto.faculty;

public record FacultyResponse(
        Long id,
        Long userId,
        String name,
        String email,
        String designation,
        Long departmentId,
        String departmentName,
        String departmentCode,
        boolean enabled,
        int assignedCoursesCount
) {}
