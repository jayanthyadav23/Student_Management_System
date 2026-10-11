package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.attendance.AttendanceRecordResponse;
import com.sms.studentmanagementsystem.dto.attendance.BulkAttendanceRequest;
import com.sms.studentmanagementsystem.dto.attendance.CourseAttendanceSummaryResponse;
import com.sms.studentmanagementsystem.dto.attendance.StudentAttendanceEntry;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.exception.UnauthorizedAccessException;
import com.sms.studentmanagementsystem.repository.*;
import com.sms.studentmanagementsystem.service.AttendanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepository,
                                 CourseRepository courseRepository,
                                 EnrollmentRepository enrollmentRepository,
                                 FacultyRepository facultyRepository,
                                 UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.facultyRepository = facultyRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getFacultyCourses(String userEmail) {
        User user = getUserByEmail(userEmail);

        List<Course> courses;
        if (user.getRole() == Role.ADMIN) {
            courses = courseRepository.findAll();
        } else {
            Faculty faculty = facultyRepository.findByUserEmail(userEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for user: " + userEmail));
            courses = courseRepository.findByFacultyId(faculty.getId());
        }

        return courses.stream().map(this::mapToCourseResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCourseEnrolledStudents(Long courseId, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        return enrollments.stream().map(this::mapToEnrollmentResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseAttendanceSummaryResponse getAttendanceSheetForDate(Long courseId, LocalDate date, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<Attendance> existingAttendance = attendanceRepository.findByCourseIdAndDate(courseId, date);

        Map<Long, Attendance> attendanceMap = existingAttendance.stream()
                .collect(Collectors.toMap(a -> a.getEnrollment().getId(), a -> a));

        List<AttendanceRecordResponse> records = new ArrayList<>();
        int presentCount = 0;
        int lateCount = 0;
        int absentCount = 0;

        for (Enrollment enrollment : enrollments) {
            Attendance att = attendanceMap.get(enrollment.getId());
            AttendanceStatus status = (att != null) ? att.getStatus() : AttendanceStatus.PRESENT;
            Long attendanceId = (att != null) ? att.getId() : null;

            if (status == AttendanceStatus.PRESENT) presentCount++;
            else if (status == AttendanceStatus.LATE) lateCount++;
            else if (status == AttendanceStatus.ABSENT) absentCount++;

            records.add(new AttendanceRecordResponse(
                    attendanceId,
                    enrollment.getId(),
                    enrollment.getStudent().getId(),
                    enrollment.getStudent().getRollNumber(),
                    enrollment.getStudent().getName(),
                    date,
                    status
            ));
        }

        return new CourseAttendanceSummaryResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                date,
                enrollments.size(),
                presentCount,
                lateCount,
                absentCount,
                records
        );
    }

    @Override
    @Transactional
    public CourseAttendanceSummaryResponse markBulkAttendance(Long courseId, BulkAttendanceRequest request, String userEmail) {
        if (request.date().isAfter(LocalDate.now())) {
            throw new BadRequestException("Attendance date cannot be in the future: " + request.date());
        }

        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        for (StudentAttendanceEntry entry : request.entries()) {
            Enrollment enrollment = enrollmentRepository.findById(entry.enrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", entry.enrollmentId()));

            if (!enrollment.getCourse().getId().equals(courseId)) {
                throw new BadRequestException("Enrollment ID " + entry.enrollmentId() + " does not belong to course " + course.getCode());
            }

            Optional<Attendance> existing = attendanceRepository.findByEnrollmentIdAndDate(entry.enrollmentId(), request.date());
            if (existing.isPresent()) {
                Attendance attendance = existing.get();
                attendance.setStatus(entry.status());
                attendanceRepository.save(attendance);
            } else {
                Attendance attendance = new Attendance(enrollment, request.date(), entry.status());
                attendanceRepository.save(attendance);
            }
        }

        return getAttendanceSheetForDate(courseId, request.date(), userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalDate> getCourseAttendanceDates(Long courseId, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        Set<LocalDate> dates = new TreeSet<>(Collections.reverseOrder());

        for (Enrollment enrollment : enrollments) {
            List<Attendance> records = attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId());
            for (Attendance record : records) {
                dates.add(record.getDate());
            }
        }

        return new ArrayList<>(dates);
    }

    private void validateCourseAccess(Course course, String userEmail) {
        User user = getUserByEmail(userEmail);
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (course.getFaculty() == null ||
                !course.getFaculty().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedAccessException("You are not assigned to instruct or view course '" + course.getCode() + "'");
        }
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
    }

    private Course getCourseById(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
    }

    private CourseResponse mapToCourseResponse(Course course) {
        long enrolledCount = enrollmentRepository.countByCourseId(course.getId());
        Long facultyId = course.getFaculty() != null ? course.getFaculty().getId() : null;
        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new CourseResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getCredits(),
                course.getDepartment().getId(),
                course.getDepartment().getName(),
                course.getDepartment().getCode(),
                facultyId,
                facultyName,
                course.getSemester(),
                enrolledCount
        );
    }

    private EnrollmentResponse mapToEnrollmentResponse(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        Student student = enrollment.getStudent();
        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new EnrollmentResponse(
                enrollment.getId(),
                student.getId(),
                student.getRollNumber(),
                student.getName(),
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getCredits(),
                facultyName,
                course.getSemester()
        );
    }
}
