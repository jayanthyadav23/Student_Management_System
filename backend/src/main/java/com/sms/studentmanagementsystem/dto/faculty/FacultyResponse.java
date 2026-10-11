package com.sms.studentmanagementsystem.dto.faculty;

public record FacultyResponse(
        Long id,
        Long userId,
        String name,
        String email,
        String designation,
        String specialization,
        String status,
        String phone,
        String officeRoom,
        Long departmentId,
        String departmentName,
        String departmentCode,
        boolean enabled,
        int assignedCoursesCount,
        int assignedSubjectsCount
) {
    public FacultyResponse(Long id, Long userId, String name, String email, String designation, Long departmentId, String departmentName, String departmentCode, boolean enabled, int assignedCoursesCount) {
        this(id, userId, name, email, designation, "General", "ACTIVE", null, null, departmentId, departmentName, departmentCode, enabled, assignedCoursesCount, 0);
    }
}
