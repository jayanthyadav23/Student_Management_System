package com.sms.studentmanagementsystem.dto.admin;

import java.util.List;

public record DashboardStatsResponse(
        long totalStudents,
        long totalFaculty,
        long totalCourses,
        long totalDepartments,
        List<DepartmentStudentCount> studentsPerDepartment,
        List<TopEnrolledCourse> topEnrolledCourses
) {}
