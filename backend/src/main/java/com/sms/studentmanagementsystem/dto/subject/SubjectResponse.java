package com.sms.studentmanagementsystem.dto.subject;

import java.time.Instant;

public record SubjectResponse(
        Long id,
        String code,
        String name,
        Integer credits,
        String type,
        Long departmentId,
        String departmentName,
        String departmentCode,
        Long courseId,
        String courseCode,
        String courseTitle,
        Long facultyId,
        String facultyName,
        Integer semester,
        String status,
        Instant createdAt
) {}
