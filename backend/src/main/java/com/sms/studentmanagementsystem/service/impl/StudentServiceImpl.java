package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentRequest;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCreateRequest;
import com.sms.studentmanagementsystem.dto.student.StudentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentUpdateRequest;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.exception.UnauthorizedAccessException;
import com.sms.studentmanagementsystem.repository.*;
import com.sms.studentmanagementsystem.service.StudentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarkRepository markRepository;
    private final FacultyRepository facultyRepository;
    private final com.sms.studentmanagementsystem.service.AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public StudentServiceImpl(StudentRepository studentRepository,
                              UserRepository userRepository,
                              DepartmentRepository departmentRepository,
                              CourseRepository courseRepository,
                              EnrollmentRepository enrollmentRepository,
                              AttendanceRepository attendanceRepository,
                              MarkRepository markRepository,
                              FacultyRepository facultyRepository,
                              com.sms.studentmanagementsystem.service.AuditLogService auditLogService,
                              PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.markRepository = markRepository;
        this.facultyRepository = facultyRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public StudentResponse createStudent(StudentCreateRequest request) {
        String cleanRollNumber = request.rollNumber().trim().toUpperCase();
        String cleanEmail = request.email().trim().toLowerCase();

        if (studentRepository.existsByRollNumber(cleanRollNumber)) {
            throw new DuplicateResourceException("Student", "rollNumber", cleanRollNumber);
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("User", "email", cleanEmail);
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        User user = new User(
                cleanEmail,
                passwordEncoder.encode(request.password()),
                Role.STUDENT,
                true
        );
        User savedUser = userRepository.save(user);

        Student student = new Student(
                savedUser,
                cleanRollNumber,
                request.name().trim(),
                request.age(),
                department,
                request.semester()
        );

        if (request.academicYear() != null && !request.academicYear().isBlank()) {
            student.setAcademicYear(request.academicYear().trim());
        }
        if (request.section() != null && !request.section().isBlank()) {
            student.setSection(request.section().trim().toUpperCase());
        }
        if (request.status() != null && !request.status().isBlank()) {
            student.setStatus(request.status().trim().toUpperCase());
        }
        if (request.phone() != null) {
            student.setPhone(request.phone().trim());
        }
        if (request.address() != null) {
            student.setAddress(request.address().trim());
        }

        Student savedStudent = studentRepository.save(student);
        auditLogService.logAction("CREATE_STUDENT", "Admin", "Student " + cleanRollNumber, "Enrolled student: " + savedStudent.getName());
        return mapToResponse(savedStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        // Enforce faculty department scoping on single student view
        validateFacultyStudentAccess(student);

        return mapToResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> getAllStudents(
            String search,
            Long departmentId,
            Integer semester,
            String academicYear,
            String section,
            Long courseId,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Long effectiveDepartmentId = resolveDepartmentScopeForCurrentUser(departmentId, courseId);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanAcademicYear = (academicYear != null && !academicYear.trim().isEmpty()) ? academicYear.trim() : null;
        String cleanSection = (section != null && !section.trim().isEmpty()) ? section.trim().toUpperCase() : null;

        Page<Student> studentPage = studentRepository.findWithFilters(
                effectiveDepartmentId,
                semester,
                cleanAcademicYear,
                cleanSection,
                cleanSearch,
                courseId,
                pageable
        );

        if (studentPage.isEmpty() && departmentId == null && effectiveDepartmentId != null) {
            studentPage = studentRepository.findWithFilters(
                    null,
                    semester,
                    cleanAcademicYear,
                    cleanSection,
                    cleanSearch,
                    courseId,
                    pageable
            );
        }

        List<StudentResponse> responseList = studentPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(responseList, studentPage);
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long id, StudentUpdateRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        validateFacultyStudentAccess(student);

        String cleanRollNumber = request.rollNumber().trim().toUpperCase();
        if (studentRepository.existsByRollNumberAndIdNot(cleanRollNumber, id)) {
            throw new DuplicateResourceException("Student", "rollNumber", cleanRollNumber);
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        student.setRollNumber(cleanRollNumber);
        student.setName(request.name().trim());
        student.setAge(request.age());
        student.setDepartment(department);
        student.setSemester(request.semester());

        if (request.academicYear() != null && !request.academicYear().isBlank()) {
            student.setAcademicYear(request.academicYear().trim());
        }
        if (request.section() != null && !request.section().isBlank()) {
            student.setSection(request.section().trim().toUpperCase());
        }
        if (request.status() != null && !request.status().isBlank()) {
            student.setStatus(request.status().trim().toUpperCase());
        }
        if (request.phone() != null) {
            student.setPhone(request.phone().trim());
        }
        if (request.address() != null) {
            student.setAddress(request.address().trim());
        }

        Student updated = studentRepository.save(student);
        auditLogService.logAction("UPDATE_STUDENT", "Admin", "Student " + cleanRollNumber, "Updated profile for: " + updated.getName());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        // Safely cascade delete student attendance, marks, and enrollments
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(id);
        for (Enrollment enrollment : enrollments) {
            attendanceRepository.deleteAll(attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId()));
            markRepository.deleteAll(markRepository.findByEnrollmentId(enrollment.getId()));
            enrollmentRepository.delete(enrollment);
        }

        User user = student.getUser();
        String studentName = student.getName();
        String roll = student.getRollNumber();

        studentRepository.delete(student);
        if (user != null) {
            userRepository.delete(user);
        }

        auditLogService.logAction("DELETE_STUDENT", "Admin", "Student " + roll, "Deleted student: " + studentName);
    }

    @Override
    @Transactional
    public StudentResponse toggleStudentStatus(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        String currentStatus = student.getStatus();
        String nextStatus = "ACTIVE".equalsIgnoreCase(currentStatus) ? "INACTIVE" : "ACTIVE";
        student.setStatus(nextStatus);

        if (student.getUser() != null) {
            student.getUser().setEnabled("ACTIVE".equalsIgnoreCase(nextStatus));
            userRepository.save(student.getUser());
        }

        Student saved = studentRepository.save(student);
        auditLogService.logAction("STATUS_CHANGE", "Admin", "Student " + student.getRollNumber(), "Changed status to: " + nextStatus);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudentsList(
            String search,
            Long departmentId,
            Integer semester,
            String academicYear,
            String section,
            Long courseId) {

        Long effectiveDepartmentId = resolveDepartmentScopeForCurrentUser(departmentId, courseId);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanAcademicYear = (academicYear != null && !academicYear.trim().isEmpty()) ? academicYear.trim() : null;
        String cleanSection = (section != null && !section.trim().isEmpty()) ? section.trim().toUpperCase() : null;

        List<Student> list = studentRepository.findListWithFilters(
                effectiveDepartmentId,
                semester,
                cleanAcademicYear,
                cleanSection,
                cleanSearch,
                courseId
        );

        if (list.isEmpty() && departmentId == null && effectiveDepartmentId != null) {
            list = studentRepository.findListWithFilters(
                    null,
                    semester,
                    cleanAcademicYear,
                    cleanSection,
                    cleanSearch,
                    courseId
            );
        }

        return list.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        validateFacultyStudentAccess(student);

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        return enrollments.stream().map(this::mapToEnrollmentResponse).toList();
    }

    @Override
    @Transactional
    public EnrollmentResponse enrollStudent(EnrollmentRequest request) {
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", request.studentId()));

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.courseId()));

        // Department-wise validation: student must belong to the course's department
        if (student.getDepartment() != null && course.getDepartment() != null &&
                !student.getDepartment().getId().equals(course.getDepartment().getId())) {
            throw new BadRequestException("Department mismatch: Student '" + student.getName() +
                    "' belongs to department '" + student.getDepartment().getName() +
                    "', but course '" + course.getCode() + "' belongs to department '" +
                    course.getDepartment().getName() + "'.");
        }

        if (enrollmentRepository.existsByStudentIdAndCourseId(request.studentId(), request.courseId())) {
            throw new DuplicateResourceException("Student is already enrolled in course '" + course.getCode() + "'");
        }

        Enrollment enrollment = new Enrollment(student, course);
        Enrollment saved = enrollmentRepository.save(enrollment);

        auditLogService.logAction("COURSE_ENROLL", "Admin", "Course " + course.getCode(), "Enrolled " + student.getName() + " into " + course.getTitle());
        return mapToEnrollmentResponse(saved);
    }

    @Override
    @Transactional
    public void unenrollStudent(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment record not found for student " + studentId + " in course " + courseId));

        attendanceRepository.deleteAll(attendanceRepository.findByEnrollmentIdOrderByDateDesc(enrollment.getId()));
        markRepository.deleteAll(markRepository.findByEnrollmentId(enrollment.getId()));
        enrollmentRepository.delete(enrollment);

        auditLogService.logAction("COURSE_UNENROLL", "Admin", "Course " + courseId, "Unenrolled student " + studentId);
    }

    private Long resolveDepartmentScopeForCurrentUser(Long requestedDepartmentId, Long courseId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equalsIgnoreCase("anonymousUser")) {
            return requestedDepartmentId;
        }

        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null || currentUser.getRole() != Role.FACULTY) {
            return requestedDepartmentId;
        }

        Faculty faculty = facultyRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for user: " + currentUser.getEmail()));

        Long facultyDeptId = (faculty.getDepartment() != null) ? faculty.getDepartment().getId() : null;
        if (facultyDeptId == null) {
            return requestedDepartmentId;
        }

        if (requestedDepartmentId != null && !requestedDepartmentId.equals(facultyDeptId)) {
            throw new UnauthorizedAccessException("Faculty members are restricted to viewing students from their own department (" + faculty.getDepartment().getName() + ")");
        }

        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
            boolean isAssigned = course.getFaculty() != null && course.getFaculty().getId().equals(faculty.getId());
            boolean sameDept = course.getDepartment() != null && course.getDepartment().getId().equals(facultyDeptId);
            if (!isAssigned && !sameDept) {
                throw new UnauthorizedAccessException("You are not assigned to instruct or view course '" + course.getCode() + "'");
            }
        }

        return (requestedDepartmentId != null) ? requestedDepartmentId : facultyDeptId;
    }

    private void validateFacultyStudentAccess(Student student) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equalsIgnoreCase("anonymousUser")) {
            return;
        }

        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(currentUser.getEmail()).orElse(null);
            if (faculty != null && faculty.getDepartment() != null && student.getDepartment() != null
                    && !faculty.getDepartment().getId().equals(student.getDepartment().getId())) {
                throw new UnauthorizedAccessException("Faculty members are restricted to viewing students from their own department (" + faculty.getDepartment().getName() + ")");
            }
        }
    }

    private StudentResponse mapToResponse(Student student) {
        long count = enrollmentRepository.countByStudentId(student.getId());
        int enrolledCount = (int) count;

        Long userId = null;
        String email = "N/A";
        boolean enabled = true;
        try {
            if (student.getUser() != null) {
                userId = student.getUser().getId();
                email = student.getUser().getEmail();
                enabled = student.getUser().isEnabled();
            }
        } catch (Exception ignored) {}

        Long deptId = null;
        String deptName = "General";
        String deptCode = "GEN";
        try {
            if (student.getDepartment() != null) {
                deptId = student.getDepartment().getId();
                deptName = student.getDepartment().getName();
                deptCode = student.getDepartment().getCode();
            }
        } catch (Exception ignored) {}

        return new StudentResponse(
                student.getId(),
                userId,
                student.getRollNumber(),
                student.getName(),
                email,
                student.getAge(),
                deptId,
                deptName,
                deptCode,
                student.getSemester(),
                student.getAcademicYear(),
                student.getSection(),
                student.getStatus(),
                student.getPhone(),
                student.getAddress(),
                student.getEnrollmentDate(),
                enabled,
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
