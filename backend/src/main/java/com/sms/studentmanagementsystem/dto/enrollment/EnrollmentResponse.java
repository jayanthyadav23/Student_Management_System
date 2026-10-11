package com.sms.studentmanagementsystem.dto.enrollment;

public record EnrollmentResponse(
        Long id,
        Long studentId,
        String studentRollNumber,
        String studentName,
        Long courseId,
        String courseCode,
        String courseTitle,
        Integer courseCredits,
        String facultyName,
        Integer semester
) {}
