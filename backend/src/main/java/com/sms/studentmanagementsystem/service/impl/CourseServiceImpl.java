package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.course.CourseAssignFacultyRequest;
import com.sms.studentmanagementsystem.dto.course.CourseRequest;
import com.sms.studentmanagementsystem.dto.course.CourseResponse;
import com.sms.studentmanagementsystem.entity.Course;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.entity.Faculty;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.EnrollmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.service.CourseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final com.sms.studentmanagementsystem.repository.StudentRepository studentRepository;
    private final com.sms.studentmanagementsystem.repository.AttendanceRepository attendanceRepository;
    private final com.sms.studentmanagementsystem.repository.MarkRepository markRepository;
    private final com.sms.studentmanagementsystem.service.AuditLogService auditLogService;

    public CourseServiceImpl(CourseRepository courseRepository,
                             DepartmentRepository departmentRepository,
                             FacultyRepository facultyRepository,
                             EnrollmentRepository enrollmentRepository,
                             com.sms.studentmanagementsystem.repository.StudentRepository studentRepository,
                             com.sms.studentmanagementsystem.repository.AttendanceRepository attendanceRepository,
                             com.sms.studentmanagementsystem.repository.MarkRepository markRepository,
                             com.sms.studentmanagementsystem.service.AuditLogService auditLogService) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.facultyRepository = facultyRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.markRepository = markRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        String cleanCode = request.code().trim().toUpperCase();

        if (courseRepository.existsByCode(cleanCode)) {
            throw new DuplicateResourceException("Course", "code", cleanCode);
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
            if (!faculty.getDepartment().getId().equals(department.getId())) {
                throw new BadRequestException("Department mismatch: Faculty '" + faculty.getName() +
                        "' belongs to department '" + faculty.getDepartment().getName() +
                        "', which does not match course department '" + department.getName() + "'.");
            }
        }

        Course course = new Course(
                cleanCode,
                request.title().trim(),
                request.credits(),
                department,
                faculty,
                request.semester()
        );

        if (request.description() != null) {
            course.setDescription(request.description().trim());
        }
        if (request.academicYear() != null && !request.academicYear().isBlank()) {
            course.setAcademicYear(request.academicYear().trim());
        }
        if (request.status() != null && !request.status().isBlank()) {
            course.setStatus(request.status().trim().toUpperCase());
        }

        Course saved = courseRepository.save(course);
        auditLogService.logAction("CREATE_COURSE", "Admin", "Course " + cleanCode, "Created course: " + saved.getTitle());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        return mapToResponse(course);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> getAllCourses(String search, Long departmentId, Long facultyId,
                                                      int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Course> coursePage;
        if (search != null && !search.trim().isEmpty()) {
            coursePage = courseRepository.searchCourses(search.trim(), pageable);
        } else if (facultyId != null) {
            coursePage = courseRepository.findByFacultyId(facultyId, pageable);
        } else if (departmentId != null) {
            coursePage = courseRepository.findByDepartmentId(departmentId, pageable);
        } else {
            coursePage = courseRepository.findAll(pageable);
        }

        List<CourseResponse> responseList = coursePage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(responseList, coursePage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCoursesDropdown(Long departmentId) {
        List<Course> list;
        if (departmentId != null) {
            list = courseRepository.findByDepartmentId(departmentId, Pageable.unpaged()).getContent();
        } else {
            list = courseRepository.findAll(Sort.by("title").ascending());
        }

        return list.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        String cleanCode = request.code().trim().toUpperCase();
        if (courseRepository.existsByCodeAndIdNot(cleanCode, id)) {
            throw new DuplicateResourceException("Course", "code", cleanCode);
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
            if (!faculty.getDepartment().getId().equals(department.getId())) {
                throw new BadRequestException("Department mismatch: Faculty '" + faculty.getName() +
                        "' belongs to department '" + faculty.getDepartment().getName() +
                        "', which does not match course department '" + department.getName() + "'.");
            }
        }

        course.setCode(cleanCode);
        course.setTitle(request.title().trim());
        course.setCredits(request.credits());
        course.setDepartment(department);
        course.setFaculty(faculty);
        course.setSemester(request.semester());

        if (request.description() != null) {
            course.setDescription(request.description().trim());
        }
        if (request.academicYear() != null && !request.academicYear().isBlank()) {
            course.setAcademicYear(request.academicYear().trim());
        }
        if (request.status() != null && !request.status().isBlank()) {
            course.setStatus(request.status().trim().toUpperCase());
        }

        Course updated = courseRepository.save(course);
        auditLogService.logAction("UPDATE_COURSE", "Admin", "Course " + cleanCode, "Updated course: " + updated.getTitle());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CourseResponse assignFacultyToCourse(Long courseId, CourseAssignFacultyRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (request.facultyId() != null) {
            Faculty faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
            if (!faculty.getDepartment().getId().equals(course.getDepartment().getId())) {
                throw new BadRequestException("Department mismatch: Faculty '" + faculty.getName() +
                        "' belongs to department '" + faculty.getDepartment().getName() +
                        "', which does not match course department '" + course.getDepartment().getName() + "'.");
            }
            course.setFaculty(faculty);
        } else {
            course.setFaculty(null);
        }

        Course updated = courseRepository.save(course);
        auditLogService.logAction("ASSIGN_FACULTY", "Admin", "Course " + course.getCode(), "Assigned faculty to: " + course.getTitle());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CourseResponse toggleCourseStatus(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        String currentStatus = course.getStatus();
        String nextStatus = "ACTIVE".equalsIgnoreCase(currentStatus) ? "ARCHIVED" : "ACTIVE";
        course.setStatus(nextStatus);

        Course saved = courseRepository.save(course);
        auditLogService.logAction("STATUS_CHANGE", "Admin", "Course " + course.getCode(), "Changed status to: " + nextStatus);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse> getCourseEnrollments(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }

        List<com.sms.studentmanagementsystem.entity.Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        return enrollments.stream().map(this::mapToEnrollmentResponse).toList();
    }

    @Override
    @Transactional
    public com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse enrollStudentToCourse(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        com.sms.studentmanagementsystem.entity.Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new DuplicateResourceException("Student is already enrolled in course '" + course.getCode() + "'");
        }

        com.sms.studentmanagementsystem.entity.Enrollment enrollment = new com.sms.studentmanagementsystem.entity.Enrollment(student, course);
        com.sms.studentmanagementsystem.entity.Enrollment saved = enrollmentRepository.save(enrollment);

        auditLogService.logAction("COURSE_ENROLL", "Admin", "Course " + course.getCode(), "Enrolled student " + student.getRollNumber());
        return mapToEnrollmentResponse(saved);
    }

    @Override
    @Transactional
    public void removeStudentFromCourse(Long courseId, Long studentId) {
        com.sms.studentmanagementsystem.entity.Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment record not found for student " + studentId + " in course " + courseId));

        attendanceRepository.deleteAll(attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId()));
        markRepository.deleteAll(markRepository.findByEnrollmentId(enrollment.getId()));
        enrollmentRepository.delete(enrollment);

        auditLogService.logAction("COURSE_UNENROLL", "Admin", "Course " + courseId, "Removed student " + studentId);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        // Cascade delete enrollments, attendance, and marks safely
        List<com.sms.studentmanagementsystem.entity.Enrollment> enrollments = enrollmentRepository.findByCourseId(id);
        for (com.sms.studentmanagementsystem.entity.Enrollment e : enrollments) {
            attendanceRepository.deleteAll(attendanceRepository.findByEnrollmentIdOrderByDateDesc(e.getId()));
            markRepository.deleteAll(markRepository.findByEnrollmentId(e.getId()));
            enrollmentRepository.delete(e);
        }

        courseRepository.delete(course);
        auditLogService.logAction("DELETE_COURSE", "Admin", "Course " + course.getCode(), "Deleted course: " + course.getTitle());
    }

    private CourseResponse mapToResponse(Course course) {
        long enrolledCount = enrollmentRepository.countByCourseId(course.getId());

        Long facultyId = course.getFaculty() != null ? course.getFaculty().getId() : null;
        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new CourseResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getDescription(),
                course.getCredits(),
                course.getDepartment().getId(),
                course.getDepartment().getName(),
                course.getDepartment().getCode(),
                facultyId,
                facultyName,
                course.getSemester(),
                course.getAcademicYear(),
                course.getStatus(),
                enrolledCount
        );
    }

    private com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse mapToEnrollmentResponse(com.sms.studentmanagementsystem.entity.Enrollment enrollment) {
        Course course = enrollment.getCourse();
        com.sms.studentmanagementsystem.entity.Student student = enrollment.getStudent();
        String facultyName = course.getFaculty() != null ? course.getFaculty().getName() : "Unassigned";

        return new com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse(
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
