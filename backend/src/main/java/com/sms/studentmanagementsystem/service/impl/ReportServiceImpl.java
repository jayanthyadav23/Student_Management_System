package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.report.*;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.exception.UnauthorizedAccessException;
import com.sms.studentmanagementsystem.repository.*;
import com.sms.studentmanagementsystem.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarkRepository markRepository;
    private final UserRepository userRepository;

    public ReportServiceImpl(CourseRepository courseRepository,
                             EnrollmentRepository enrollmentRepository,
                             AttendanceRepository attendanceRepository,
                             MarkRepository markRepository,
                             UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.markRepository = markRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CourseAttendanceReportResponse getAttendanceReport(Long courseId, Boolean below75Only, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<StudentAttendanceReportItem> studentItems = new ArrayList<>();

        double totalAttendanceSum = 0.0;
        int studentsEvaluated = 0;
        int below75Count = 0;

        for (Enrollment enrollment : enrollments) {
            List<Attendance> records = attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId());
            int totalClasses = records.size();
            int attendedClasses = 0;

            for (Attendance a : records) {
                if (a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE) {
                    attendedClasses++;
                }
            }

            double percentage = (totalClasses > 0)
                    ? Math.round(((double) attendedClasses / totalClasses * 100.0) * 10.0) / 10.0
                    : 100.0;

            boolean isBelow75 = percentage < 75.0;
            if (isBelow75) {
                below75Count++;
            }

            if (totalClasses > 0) {
                totalAttendanceSum += percentage;
                studentsEvaluated++;
            }

            if (Boolean.TRUE.equals(below75Only) && !isBelow75) {
                continue;
            }

            Student student = enrollment.getStudent();
            studentItems.add(new StudentAttendanceReportItem(
                    student.getId(),
                    student.getRollNumber(),
                    student.getName(),
                    student.getDepartment().getName(),
                    totalClasses,
                    attendedClasses,
                    percentage,
                    isBelow75
            ));
        }

        double courseAverage = (studentsEvaluated > 0)
                ? Math.round((totalAttendanceSum / studentsEvaluated) * 10.0) / 10.0
                : 100.0;

        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new CourseAttendanceReportResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                facultyName,
                enrollments.size(),
                courseAverage,
                below75Count,
                studentItems
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResultReportResponse getResultsReport(Long courseId, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<StudentResultReportItem> studentResults = new ArrayList<>();

        double totalScoreSum = 0.0;
        int gradedCount = 0;
        int passedCount = 0;
        double highestPercentage = 0.0;
        String topperName = "N/A";
        String topperRollNumber = "N/A";

        for (Enrollment enrollment : enrollments) {
            List<Mark> marks = markRepository.findByEnrollmentId(enrollment.getId());
            double totalScore = 0.0;
            double maxScore = 0.0;

            for (Mark m : marks) {
                totalScore += m.getScore();
                maxScore += m.getMaxScore();
            }

            if (maxScore > 0) {
                gradedCount++;
                double percentage = Math.round((totalScore / maxScore * 100.0) * 100.0) / 100.0;
                String grade = calculateGrade(percentage);
                String status = percentage >= 50.0 ? "PASS" : "FAIL";

                if ("PASS".equals(status)) {
                    passedCount++;
                }

                totalScoreSum += percentage;

                if (percentage > highestPercentage || topperName.equals("N/A")) {
                    highestPercentage = percentage;
                    topperName = enrollment.getStudent().getName();
                    topperRollNumber = enrollment.getStudent().getRollNumber();
                }

                studentResults.add(new StudentResultReportItem(
                        enrollment.getStudent().getId(),
                        enrollment.getStudent().getRollNumber(),
                        enrollment.getStudent().getName(),
                        totalScore,
                        maxScore,
                        percentage,
                        grade,
                        status
                ));
            } else {
                studentResults.add(new StudentResultReportItem(
                        enrollment.getStudent().getId(),
                        enrollment.getStudent().getRollNumber(),
                        enrollment.getStudent().getName(),
                        0.0,
                        0.0,
                        0.0,
                        "Pending",
                        "UNGRADED"
                ));
            }
        }

        double classAverage = (gradedCount > 0)
                ? Math.round((totalScoreSum / gradedCount) * 100.0) / 100.0
                : 0.0;

        double passRate = (gradedCount > 0)
                ? Math.round(((double) passedCount / gradedCount * 100.0) * 10.0) / 10.0
                : 0.0;

        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new CourseResultReportResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                facultyName,
                enrollments.size(),
                gradedCount,
                classAverage,
                highestPercentage,
                topperName,
                topperRollNumber,
                passRate,
                studentResults
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CoursePerformanceResponse getCoursePerformance(Long courseId, String userEmail) {
        CourseResultReportResponse results = getResultsReport(courseId, userEmail);

        int countO = 0; // >= 90
        int countA = 0; // 80 - 89.9
        int countB = 0; // 70 - 79.9
        int countC = 0; // 60 - 69.9
        int countD = 0; // 50 - 59.9
        int countF = 0; // < 50

        int gradedCount = results.gradedStudents();

        for (StudentResultReportItem item : results.students()) {
            if ("UNGRADED".equals(item.status())) continue;

            double p = item.percentage();
            if (p >= 90.0) countO++;
            else if (p >= 80.0) countA++;
            else if (p >= 70.0) countB++;
            else if (p >= 60.0) countC++;
            else if (p >= 50.0) countD++;
            else countF++;
        }

        List<ScoreDistributionBucket> buckets = List.of(
                new ScoreDistributionBucket("O", "90% - 100%", countO, calculateBucketPct(countO, gradedCount)),
                new ScoreDistributionBucket("A", "80% - 89%", countA, calculateBucketPct(countA, gradedCount)),
                new ScoreDistributionBucket("B", "70% - 79%", countB, calculateBucketPct(countB, gradedCount)),
                new ScoreDistributionBucket("C", "60% - 69%", countC, calculateBucketPct(countC, gradedCount)),
                new ScoreDistributionBucket("D", "50% - 59%", countD, calculateBucketPct(countD, gradedCount)),
                new ScoreDistributionBucket("F", "< 50% (Fail)", countF, calculateBucketPct(countF, gradedCount))
        );

        return new CoursePerformanceResponse(
                results.courseId(),
                results.courseCode(),
                results.courseTitle(),
                results.facultyName(),
                results.totalEnrolled(),
                gradedCount,
                results.classAveragePercentage(),
                results.passRate(),
                buckets
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAttendanceReportCsv(Long courseId, Boolean below75Only, String userEmail) {
        CourseAttendanceReportResponse report = getAttendanceReport(courseId, below75Only, userEmail);

        StringBuilder sb = new StringBuilder();
        sb.append("Course Code,Course Title,Faculty,Total Enrolled,Average Attendance %\n");
        sb.append(escapeCsv(report.courseCode())).append(",")
                .append(escapeCsv(report.courseTitle())).append(",")
                .append(escapeCsv(report.facultyName())).append(",")
                .append(report.totalEnrolled()).append(",")
                .append(report.courseAverageAttendance()).append("%\n\n");

        sb.append("Roll Number,Student Name,Department,Total Classes,Attended Classes,Attendance %,Status\n");
        for (StudentAttendanceReportItem item : report.students()) {
            sb.append(escapeCsv(item.rollNumber())).append(",")
                    .append(escapeCsv(item.studentName())).append(",")
                    .append(escapeCsv(item.departmentName())).append(",")
                    .append(item.totalClasses()).append(",")
                    .append(item.attendedClasses()).append(",")
                    .append(item.percentage()).append("%,")
                    .append(item.isBelow75() ? "CRITICAL (<75%)" : "SATISFACTORY").append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportResultsReportCsv(Long courseId, String userEmail) {
        CourseResultReportResponse report = getResultsReport(courseId, userEmail);

        StringBuilder sb = new StringBuilder();
        sb.append("Course Code,Course Title,Faculty,Class Average %,Highest %,Topper,Pass Rate %\n");
        sb.append(escapeCsv(report.courseCode())).append(",")
                .append(escapeCsv(report.courseTitle())).append(",")
                .append(escapeCsv(report.facultyName())).append(",")
                .append(report.classAveragePercentage()).append("%,")
                .append(report.highestPercentage()).append("%,")
                .append(escapeCsv(report.topperName() + " (" + report.topperRollNumber() + ")")).append(",")
                .append(report.passRate()).append("%\n\n");

        sb.append("Roll Number,Student Name,Score Obtained,Max Score,Percentage %,Grade,Status\n");
        for (StudentResultReportItem item : report.students()) {
            sb.append(escapeCsv(item.rollNumber())).append(",")
                    .append(escapeCsv(item.studentName())).append(",")
                    .append(item.totalScore()).append(",")
                    .append(item.maxScore()).append(",")
                    .append(item.percentage()).append("%,")
                    .append(escapeCsv(item.grade())).append(",")
                    .append(escapeCsv(item.status())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCoursePerformanceCsv(Long courseId, String userEmail) {
        CoursePerformanceResponse report = getCoursePerformance(courseId, userEmail);

        StringBuilder sb = new StringBuilder();
        sb.append("Course Code,Course Title,Faculty,Enrolled,Evaluated,Average Score %,Pass Rate %\n");
        sb.append(escapeCsv(report.courseCode())).append(",")
                .append(escapeCsv(report.courseTitle())).append(",")
                .append(escapeCsv(report.facultyName())).append(",")
                .append(report.totalEnrolled()).append(",")
                .append(report.evaluatedStudents()).append(",")
                .append(report.averagePercentage()).append("%,")
                .append(report.passRate()).append("%\n\n");

        sb.append("Grade,Score Range,Student Count,Class Percentage %\n");
        for (ScoreDistributionBucket bucket : report.distributionBuckets()) {
            sb.append(escapeCsv(bucket.gradeLabel())).append(",")
                    .append(escapeCsv(bucket.scoreRange())).append(",")
                    .append(bucket.count()).append(",")
                    .append(bucket.percentageOfClass()).append("%\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void validateCourseAccess(Course course, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (course.getFaculty() == null ||
                !course.getFaculty().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedAccessException("You are not authorized to view reports for course '" + course.getCode() + "'");
        }
    }

    private Course getCourseById(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
    }

    private String calculateGrade(double percentage) {
        if (percentage >= 90.0) return "O";
        if (percentage >= 80.0) return "A";
        if (percentage >= 70.0) return "B";
        if (percentage >= 60.0) return "C";
        if (percentage >= 50.0) return "D";
        return "F";
    }

    private Double calculateBucketPct(int count, int total) {
        return (total > 0)
                ? Math.round(((double) count / total * 100.0) * 10.0) / 10.0
                : 0.0;
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
