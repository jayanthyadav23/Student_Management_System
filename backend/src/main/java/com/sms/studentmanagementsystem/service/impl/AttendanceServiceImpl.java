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
    private final SubjectRepository subjectRepository;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepository,
                                 CourseRepository courseRepository,
                                 EnrollmentRepository enrollmentRepository,
                                 FacultyRepository facultyRepository,
                                 UserRepository userRepository,
                                 SubjectRepository subjectRepository) {
        this.attendanceRepository = attendanceRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.facultyRepository = facultyRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
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
            Long deptId = (faculty.getDepartment() != null) ? faculty.getDepartment().getId() : null;
            courses = courseRepository.findCoursesForFaculty(faculty.getId(), deptId);
            if (courses.isEmpty()) {
                courses = courseRepository.findAll();
            }
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
                .collect(Collectors.toMap(a -> a.getEnrollment().getId(), a -> a, (a1, a2) -> a1));

        Map<Long, Object[]> summaryMap = new HashMap<>();
        try {
            List<Object[]> summaryList = attendanceRepository.getCourseAttendanceSummary(courseId);
            if (summaryList != null) {
                for (Object[] arr : summaryList) {
                    if (arr != null && arr.length > 0 && arr[0] instanceof Number numId) {
                        summaryMap.put(numId.longValue(), arr);
                    }
                }
            }
        } catch (Exception ex) {
            // Log and allow attendance sheet to proceed safely
        }

        List<AttendanceRecordResponse> records = new ArrayList<>();
        int presentCount = 0;
        int lateCount = 0;
        int absentCount = 0;

        for (Enrollment enrollment : enrollments) {
            if (enrollment == null || enrollment.getStudent() == null) continue;

            Attendance att = attendanceMap.get(enrollment.getId());
            AttendanceStatus status = (att != null) ? att.getStatus() : AttendanceStatus.PRESENT;
            String remarks = (att != null && att.getRemarks() != null) ? att.getRemarks() : "";
            Long attendanceId = (att != null) ? att.getId() : null;

            if (status == AttendanceStatus.PRESENT) presentCount++;
            else if (status == AttendanceStatus.LATE) lateCount++;
            else if (status == AttendanceStatus.ABSENT) absentCount++;

            Object[] stat = summaryMap.get(enrollment.getId());
            int totalSessions = (stat != null && stat.length > 1 && stat[1] instanceof Number n) ? n.intValue() : 0;
            int presentSessions = (stat != null && stat.length > 2 && stat[2] instanceof Number n) ? n.intValue() : 0;
            int lateSessions = (stat != null && stat.length > 3 && stat[3] instanceof Number n) ? n.intValue() : 0;
            int attended = presentSessions + lateSessions;
            double pct = (totalSessions > 0)
                    ? Math.round(((double) (presentSessions + lateSessions * 0.5) / totalSessions * 100.0) * 10.0) / 10.0
                    : 100.0;

            String rollNumber = enrollment.getStudent().getRollNumber() != null ? enrollment.getStudent().getRollNumber() : "N/A";
            String studentName = enrollment.getStudent().getName() != null ? enrollment.getStudent().getName() : "Unknown";

            records.add(new AttendanceRecordResponse(
                    attendanceId,
                    enrollment.getId(),
                    enrollment.getStudent().getId(),
                    rollNumber,
                    studentName,
                    date,
                    status,
                    remarks,
                    pct,
                    totalSessions,
                    attended
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
        if (request.date().isAfter(LocalDate.now().plusDays(1))) {
            throw new BadRequestException("Attendance date cannot be in the future: " + request.date());
        }

        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        // Deduplicate incoming entries by enrollmentId
        Map<Long, StudentAttendanceEntry> uniqueEntries = request.entries().stream()
                .collect(Collectors.toMap(StudentAttendanceEntry::enrollmentId, e -> e, (e1, e2) -> e2));

        for (StudentAttendanceEntry entry : uniqueEntries.values()) {
            Enrollment enrollment = enrollmentRepository.findById(entry.enrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", entry.enrollmentId()));

            if (!enrollment.getCourse().getId().equals(courseId)) {
                throw new BadRequestException("Enrollment ID " + entry.enrollmentId() + " does not belong to course " + course.getCode());
            }

            Optional<Attendance> existing = attendanceRepository.findByEnrollmentIdAndDate(entry.enrollmentId(), request.date());
            if (existing.isPresent()) {
                Attendance attendance = existing.get();
                attendance.setStatus(entry.status());
                if (entry.remarks() != null) {
                    attendance.setRemarks(entry.remarks());
                }
                attendanceRepository.save(attendance);
            } else {
                Attendance attendance = new Attendance(enrollment, request.date(), entry.status(), entry.remarks());
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

        Faculty faculty = facultyRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("Faculty profile not found for user: " + userEmail));

        boolean isDirectlyAssigned = course.getFaculty() != null &&
                (course.getFaculty().getId().equals(faculty.getId()) ||
                 course.getFaculty().getUser().getEmail().equalsIgnoreCase(userEmail));

        boolean teachesSubject = subjectRepository.existsByCourseIdAndFacultyId(course.getId(), faculty.getId());

        Long facultyDeptId = (faculty.getDepartment() != null) ? faculty.getDepartment().getId() : null;
        boolean sameDepartment = course.getDepartment() != null &&
                facultyDeptId != null &&
                course.getDepartment().getId().equals(facultyDeptId);

        boolean courseUnassigned = course.getFaculty() == null;

        boolean noRestrictedCourses = courseRepository.findCoursesForFaculty(faculty.getId(), facultyDeptId).isEmpty();

        if (!isDirectlyAssigned && !teachesSubject && !sameDepartment && !courseUnassigned && !noRestrictedCourses) {
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

        Long deptId = course.getDepartment() != null ? course.getDepartment().getId() : null;
        String deptName = course.getDepartment() != null ? course.getDepartment().getName() : "General";
        String deptCode = course.getDepartment() != null ? course.getDepartment().getCode() : "GEN";

        return new CourseResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getCredits(),
                deptId,
                deptName,
                deptCode,
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
