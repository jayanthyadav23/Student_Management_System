package com.sms.studentmanagementsystem.dto.course;

public record CourseResponse(
        Long id,
        String code,
        String title,
        String description,
        Integer credits,
        Long departmentId,
        String departmentName,
        String departmentCode,
        Long facultyId,
        String facultyName,
        Integer semester,
        String academicYear,
        String status,
        long enrolledStudentsCount
) {
    public CourseResponse(Long id, String code, String title, Integer credits, Long departmentId, String departmentName, String departmentCode, Long facultyId, String facultyName, Integer semester, long enrolledStudentsCount) {
        this(id, code, title, null, credits, departmentId, departmentName, departmentCode, facultyId, facultyName, semester, "2025-2026", "ACTIVE", enrolledStudentsCount);
    }
}
