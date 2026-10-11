package com.sms.studentmanagementsystem.dto.course;

public record CourseResponse(
        Long id,
        String code,
        String title,
        Integer credits,
        Long departmentId,
        String departmentName,
        String departmentCode,
        Long facultyId,
        String facultyName,
        Integer semester,
        long enrolledStudentsCount
) {}
