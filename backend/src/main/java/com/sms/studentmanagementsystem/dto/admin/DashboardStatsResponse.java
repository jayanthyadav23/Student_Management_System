package com.sms.studentmanagementsystem.dto.admin;

import com.sms.studentmanagementsystem.dto.audit.AuditLogResponse;
import java.util.List;

public record DashboardStatsResponse(
        long totalStudents,
        long totalFaculty,
        long totalCourses,
        long totalDepartments,
        long totalSubjects,
        long activeAnnouncementsCount,
        List<DepartmentStudentCount> studentsPerDepartment,
        List<TopEnrolledCourse> topEnrolledCourses,
        List<AuditLogResponse> recentActivities
) {}
