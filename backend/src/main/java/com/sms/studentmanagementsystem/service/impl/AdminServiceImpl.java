package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.admin.DashboardStatsResponse;
import com.sms.studentmanagementsystem.dto.admin.DepartmentStudentCount;
import com.sms.studentmanagementsystem.dto.admin.TopEnrolledCourse;
import com.sms.studentmanagementsystem.entity.User;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.*;
import com.sms.studentmanagementsystem.service.AdminService;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(UserRepository userRepository,
                            StudentRepository studentRepository,
                            FacultyRepository facultyRepository,
                            CourseRepository courseRepository,
                            DepartmentRepository departmentRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void toggleUserAccountStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setEnabled(enabled);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalStudents = studentRepository.count();
        long totalFaculty = facultyRepository.count();
        long totalCourses = courseRepository.count();
        long totalDepartments = departmentRepository.count();

        List<Object[]> rawDeptCounts = studentRepository.countStudentsPerDepartment();
        List<DepartmentStudentCount> studentsPerDepartment = new ArrayList<>();
        for (Object[] row : rawDeptCounts) {
            String deptName = (String) row[0];
            long count = ((Number) row[1]).longValue();
            studentsPerDepartment.add(new DepartmentStudentCount(deptName, count));
        }

        List<Object[]> rawTopCourses = courseRepository.findTopEnrolledCourses(PageRequest.of(0, 5));
        List<TopEnrolledCourse> topEnrolledCourses = new ArrayList<>();
        for (Object[] row : rawTopCourses) {
            Long courseId = ((Number) row[0]).longValue();
            String code = (String) row[1];
            String title = (String) row[2];
            long count = ((Number) row[3]).longValue();
            topEnrolledCourses.add(new TopEnrolledCourse(courseId, code, title, count));
        }

        return new DashboardStatsResponse(
                totalStudents,
                totalFaculty,
                totalCourses,
                totalDepartments,
                studentsPerDepartment,
                topEnrolledCourses
        );
    }
}
