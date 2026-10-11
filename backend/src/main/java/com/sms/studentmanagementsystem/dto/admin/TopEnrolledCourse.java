package com.sms.studentmanagementsystem.dto.admin;

public record TopEnrolledCourse(
        Long courseId,
        String courseCode,
        String courseTitle,
        long enrollmentCount
) {}
