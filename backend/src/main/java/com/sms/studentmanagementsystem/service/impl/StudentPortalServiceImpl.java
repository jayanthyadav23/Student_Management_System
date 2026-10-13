package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.attendance.AttendanceRecordResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.marks.MarkResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCourseAttendanceResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCourseResultResponse;
import com.sms.studentmanagementsystem.dto.student.StudentOverallResultResponse;
import com.sms.studentmanagementsystem.dto.student.StudentProfileResponse;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.AttendanceRepository;
import com.sms.studentmanagementsystem.repository.EnrollmentRepository;
import com.sms.studentmanagementsystem.repository.MarkRepository;
import com.sms.studentmanagementsystem.repository.StudentRepository;
import com.sms.studentmanagementsystem.service.StudentPortalService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class StudentPortalServiceImpl implements StudentPortalService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarkRepository markRepository;

    public StudentPortalServiceImpl(StudentRepository studentRepository,
                                    EnrollmentRepository enrollmentRepository,
                                    AttendanceRepository attendanceRepository,
                                    MarkRepository markRepository) {
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.markRepository = markRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile(String userEmail) {
        Student student = getStudentByEmail(userEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        int totalSessions = 0;
        int attendedSessions = 0;
        boolean hasAttendanceWarning = false;

        for (Enrollment enrollment : enrollments) {
            List<Attendance> records = attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId());
            int courseTotal = records.size();
            int courseAttended = 0;

            for (Attendance a : records) {
                if (a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE) {
                    courseAttended++;
                }
            }

            totalSessions += courseTotal;
            attendedSessions += courseAttended;

            if (courseTotal > 0) {
                double coursePercentage = (double) courseAttended / courseTotal * 100.0;
                if (coursePercentage < 75.0) {
                    hasAttendanceWarning = true;
                }
            }
        }

        double overallAttendance = (totalSessions > 0)
                ? Math.round(((double) attendedSessions / totalSessions * 100.0) * 10.0) / 10.0
                : 100.0;

        if (overallAttendance < 75.0) {
            hasAttendanceWarning = true;
        }

        Long deptId = null;
        String deptName = "General";
        String deptCode = "GEN";
        if (student.getDepartment() != null) {
            deptId = student.getDepartment().getId();
            deptName = student.getDepartment().getName() != null ? student.getDepartment().getName() : "General";
            deptCode = student.getDepartment().getCode() != null ? student.getDepartment().getCode() : "GEN";
        }

        Long userId = null;
        String email = userEmail;
        if (student.getUser() != null) {
            userId = student.getUser().getId();
            email = student.getUser().getEmail() != null ? student.getUser().getEmail() : userEmail;
        }

        return new StudentProfileResponse(
                student.getId(),
                userId,
                student.getRollNumber() != null ? student.getRollNumber() : "N/A",
                student.getName() != null ? student.getName() : "Student",
                email,
                student.getAge(),
                deptId,
                deptName,
                deptCode,
                student.getSemester(),
                student.getEnrollmentDate(),
                enrollments.size(),
                overallAttendance,
                hasAttendanceWarning
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyCourses(String userEmail) {
        Student student = getStudentByEmail(userEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        return enrollments.stream().map(this::mapToEnrollmentResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentCourseAttendanceResponse> getMyAttendance(String userEmail) {
        Student student = getStudentByEmail(userEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        List<StudentCourseAttendanceResponse> result = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            result.add(calculateCourseAttendance(enrollment));
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public StudentCourseAttendanceResponse getMyCourseAttendance(Long courseId, String userEmail) {
        Student student = getStudentByEmail(userEmail);
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not enrolled in course with ID: " + courseId));

        return calculateCourseAttendance(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentOverallResultResponse getMyResults(String userEmail) {
        Student student = getStudentByEmail(userEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        List<StudentCourseResultResponse> courseResults = new ArrayList<>();
        double overallScoreObtained = 0.0;
        double overallMaxScore = 0.0;
        int passedCourses = 0;
        int failedCourses = 0;

        for (Enrollment enrollment : enrollments) {
            List<Mark> marks = markRepository.findByEnrollmentId(enrollment.getId());
            double courseScore = 0.0;
            double courseMax = 0.0;
            List<MarkResponse> markResponses = new ArrayList<>();

            for (Mark mark : marks) {
                courseScore += mark.getScore();
                courseMax += mark.getMaxScore();
                markResponses.add(mapToMarkResponse(mark));
            }

            double coursePercentage = (courseMax > 0)
                    ? Math.round((courseScore / courseMax * 100.0) * 100.0) / 100.0
                    : 0.0;

            String grade = calculateGrade(coursePercentage);
            String status = coursePercentage >= 50.0 ? "PASS" : "FAIL";

            if ("PASS".equals(status)) {
                passedCourses++;
            } else if (courseMax > 0) {
                failedCourses++;
            }

            overallScoreObtained += courseScore;
            overallMaxScore += courseMax;

            Course course = enrollment.getCourse();
            courseResults.add(new StudentCourseResultResponse(
                    course.getId(),
                    course.getCode(),
                    course.getTitle(),
                    course.getCredits(),
                    courseScore,
                    courseMax,
                    coursePercentage,
                    grade,
                    status,
                    markResponses
            ));
        }

        double overallPercentage = (overallMaxScore > 0)
                ? Math.round((overallScoreObtained / overallMaxScore * 100.0) * 100.0) / 100.0
                : 0.0;

        String overallGrade = calculateGrade(overallPercentage);
        String overallStatus = (failedCourses == 0 && overallPercentage >= 50.0) ? "PASS" : "FAIL";

        return new StudentOverallResultResponse(
                student.getId(),
                student.getRollNumber(),
                student.getName(),
                overallScoreObtained,
                overallMaxScore,
                overallPercentage,
                overallGrade,
                overallStatus,
                enrollments.size(),
                passedCourses,
                failedCourses,
                courseResults
        );
    }

    private Student getStudentByEmail(String userEmail) {
        return studentRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userEmail));
    }

    private StudentCourseAttendanceResponse calculateCourseAttendance(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        List<Attendance> records = attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId());

        int presentCount = 0;
        int lateCount = 0;
        int absentCount = 0;

        List<AttendanceRecordResponse> recordResponses = new ArrayList<>();
        for (Attendance a : records) {
            if (a.getStatus() == AttendanceStatus.PRESENT) presentCount++;
            else if (a.getStatus() == AttendanceStatus.LATE) lateCount++;
            else if (a.getStatus() == AttendanceStatus.ABSENT) absentCount++;

            recordResponses.add(new AttendanceRecordResponse(
                    a.getId(),
                    enrollment.getId(),
                    enrollment.getStudent().getId(),
                    enrollment.getStudent().getRollNumber() != null ? enrollment.getStudent().getRollNumber() : "N/A",
                    enrollment.getStudent().getName() != null ? enrollment.getStudent().getName() : "Student",
                    a.getDate(),
                    a.getStatus(),
                    a.getRemarks() != null ? a.getRemarks() : ""
            ));
        }

        int totalSessions = records.size();
        double attendancePercentage = (totalSessions > 0)
                ? Math.round(((double) (presentCount + lateCount) / totalSessions * 100.0) * 10.0) / 10.0
                : 100.0;

        boolean lowAttendanceWarning = attendancePercentage < 75.0;
        String facultyName = (course != null && course.getFaculty() != null) ? course.getFaculty().getName() : "Unassigned";

        return new StudentCourseAttendanceResponse(
                course != null ? course.getId() : null,
                course != null ? course.getCode() : "N/A",
                course != null ? course.getTitle() : "Course",
                course != null ? course.getCredits() : null,
                facultyName,
                totalSessions,
                presentCount,
                lateCount,
                absentCount,
                attendancePercentage,
                lowAttendanceWarning,
                recordResponses
        );
    }

    public static String calculateGrade(double percentage) {
        if (percentage >= 90.0) return "O";
        if (percentage >= 80.0) return "A";
        if (percentage >= 70.0) return "B";
        if (percentage >= 60.0) return "C";
        if (percentage >= 50.0) return "D";
        return "F";
    }

    private EnrollmentResponse mapToEnrollmentResponse(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        Student student = enrollment.getStudent();
        String facultyName = (course != null && course.getFaculty() != null) ? course.getFaculty().getName() : "Unassigned";

        return new EnrollmentResponse(
                enrollment.getId(),
                student != null ? student.getId() : null,
                student != null && student.getRollNumber() != null ? student.getRollNumber() : "N/A",
                student != null && student.getName() != null ? student.getName() : "Student",
                course != null ? course.getId() : null,
                course != null && course.getCode() != null ? course.getCode() : "N/A",
                course != null && course.getTitle() != null ? course.getTitle() : "Course",
                course != null ? course.getCredits() : null,
                facultyName,
                course != null ? course.getSemester() : null
        );
    }

    private MarkResponse mapToMarkResponse(Mark mark) {
        double percentage = (mark.getMaxScore() > 0)
                ? Math.round((mark.getScore() / mark.getMaxScore() * 100.0) * 100.0) / 100.0
                : 0.0;

        Enrollment enrollment = mark.getEnrollment();
        Student student = enrollment != null ? enrollment.getStudent() : null;
        Long enrollId = enrollment != null ? enrollment.getId() : null;
        Long studentId = student != null ? student.getId() : null;
        String roll = student != null && student.getRollNumber() != null ? student.getRollNumber() : "N/A";
        String name = student != null && student.getName() != null ? student.getName() : "Student";

        return new MarkResponse(
                mark.getId(),
                enrollId,
                studentId,
                roll,
                name,
                mark.getExamType(),
                mark.getScore(),
                mark.getMaxScore(),
                percentage
        );
    }
}
