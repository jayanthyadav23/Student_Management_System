package com.sms.studentmanagementsystem.dto.department;

public record DepartmentResponse(
        Long id,
        String name,
        String code,
        long studentCount,
        long facultyCount
) {}
