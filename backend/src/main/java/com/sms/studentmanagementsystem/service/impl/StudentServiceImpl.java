package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentRequest;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentCreateRequest;
import com.sms.studentmanagementsystem.dto.student.StudentResponse;
import com.sms.studentmanagementsystem.dto.student.StudentUpdateRequest;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.EnrollmentRepository;
import com.sms.studentmanagementsystem.repository.StudentRepository;
import com.sms.studentmanagementsystem.repository.UserRepository;
import com.sms.studentmanagementsystem.service.StudentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final PasswordEncoder passwordEncoder;

    public StudentServiceImpl(StudentRepository studentRepository,
                              UserRepository userRepository,
                              DepartmentRepository departmentRepository,
                              CourseRepository courseRepository,
                              EnrollmentRepository enrollmentRepository,
                              PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
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

        Student savedStudent = studentRepository.save(student);
        return mapToResponse(savedStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        return mapToResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> getAllStudents(String search, Long departmentId, Integer semester,
                                                        int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Student> studentPage;
        if (search != null && !search.trim().isEmpty()) {
            studentPage = studentRepository.searchStudents(search.trim(), pageable);
        } else if (departmentId != null) {
            studentPage = studentRepository.findByDepartmentId(departmentId, pageable);
        } else {
            studentPage = studentRepository.findAll(pageable);
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

        Student updated = studentRepository.save(student);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        User user = student.getUser();
        studentRepository.delete(student);
        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", "id", studentId);
        }

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

        if (enrollmentRepository.existsByStudentIdAndCourseId(request.studentId(), request.courseId())) {
            throw new DuplicateResourceException("Student is already enrolled in course '" + course.getCode() + "'");
        }

        Enrollment enrollment = new Enrollment(student, course);
        Enrollment saved = enrollmentRepository.save(enrollment);

        return mapToEnrollmentResponse(saved);
    }

    @Override
    @Transactional
    public void unenrollStudent(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment record not found for student " + studentId + " in course " + courseId));

        enrollmentRepository.delete(enrollment);
    }

    private StudentResponse mapToResponse(Student student) {
        int enrolledCount = enrollmentRepository.findByStudentId(student.getId()).size();

        return new StudentResponse(
                student.getId(),
                student.getUser().getId(),
                student.getRollNumber(),
                student.getName(),
                student.getUser().getEmail(),
                student.getAge(),
                student.getDepartment().getId(),
                student.getDepartment().getName(),
                student.getDepartment().getCode(),
                student.getSemester(),
                student.getEnrollmentDate(),
                student.getUser().isEnabled(),
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
