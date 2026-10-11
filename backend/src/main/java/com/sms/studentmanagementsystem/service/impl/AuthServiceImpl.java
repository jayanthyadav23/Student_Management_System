package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.auth.AuthResponse;
import com.sms.studentmanagementsystem.dto.auth.LoginRequest;
import com.sms.studentmanagementsystem.dto.auth.RegisterRequest;
import com.sms.studentmanagementsystem.dto.auth.UserSummaryResponse;
import com.sms.studentmanagementsystem.dto.department.DepartmentResponse;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.entity.Faculty;
import com.sms.studentmanagementsystem.entity.Role;
import com.sms.studentmanagementsystem.entity.Student;
import com.sms.studentmanagementsystem.entity.User;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.exception.UnauthorizedAccessException;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.repository.StudentRepository;
import com.sms.studentmanagementsystem.repository.UserRepository;
import com.sms.studentmanagementsystem.security.JwtTokenProvider;
import com.sms.studentmanagementsystem.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider,
                           UserRepository userRepository,
                           FacultyRepository facultyRepository,
                           StudentRepository studentRepository,
                           DepartmentRepository departmentRepository,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", cleanEmail));

        String displayName = resolveDisplayName(user);

        return AuthResponse.of(token, user.getId(), user.getEmail(), displayName, user.getRole().name());
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        String roleStr = (request.role() != null && !request.role().isBlank())
                ? request.role().trim().toUpperCase()
                : "STUDENT";

        Role targetRole;
        try {
            targetRole = Role.valueOf(roleStr);
        } catch (IllegalArgumentException ex) {
            targetRole = Role.STUDENT;
        }

        if (targetRole == Role.ADMIN) {
            throw new BadRequestException("Direct registration as ADMIN is prohibited. Administrator accounts must be provisioned by institutional initialization.");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("An account with email '" + cleanEmail + "' already exists");
        }

        if (targetRole == Role.STUDENT) {
            if (request.rollNumber() == null || request.rollNumber().trim().isBlank()) {
                throw new BadRequestException("Roll number is required for student registration");
            }
            String cleanRollNumber = request.rollNumber().trim().toUpperCase();
            if (studentRepository.existsByRollNumber(cleanRollNumber)) {
                throw new DuplicateResourceException("A student with roll number '" + cleanRollNumber + "' already exists");
            }
            if (request.departmentId() == null) {
                throw new BadRequestException("Department selection is required for student registration");
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

            int age = (request.age() != null) ? request.age() : 18;
            int semester = (request.semester() != null) ? request.semester() : 1;

            Student student = new Student(
                    savedUser,
                    cleanRollNumber,
                    request.name().trim(),
                    age,
                    department,
                    semester
            );
            Student savedStudent = studentRepository.save(student);

            String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
            return AuthResponse.of(token, savedUser.getId(), savedUser.getEmail(), savedStudent.getName(), savedUser.getRole().name());

        } else if (targetRole == Role.FACULTY) {
            if (request.departmentId() == null) {
                throw new BadRequestException("Department selection is required for faculty registration");
            }
            Department department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

            User user = new User(
                    cleanEmail,
                    passwordEncoder.encode(request.password()),
                    Role.FACULTY,
                    true
            );
            User savedUser = userRepository.save(user);

            String designation = (request.designation() != null && !request.designation().isBlank())
                    ? request.designation().trim()
                    : "Assistant Professor";

            Faculty faculty = new Faculty(
                    savedUser,
                    request.name().trim(),
                    designation,
                    department
            );
            Faculty savedFaculty = facultyRepository.save(faculty);

            String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
            return AuthResponse.of(token, savedUser.getId(), savedUser.getEmail(), savedFaculty.getName(), savedUser.getRole().name());

        } else { // ADMIN
            User user = new User(
                    cleanEmail,
                    passwordEncoder.encode(request.password()),
                    Role.ADMIN,
                    true
            );
            User savedUser = userRepository.save(user);

            String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
            return AuthResponse.of(token, savedUser.getId(), savedUser.getEmail(), request.name().trim(), savedUser.getRole().name());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedAccessException("No active authenticated session found");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String displayName = resolveDisplayName(user);
        Long profileId = resolveProfileId(user);

        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                displayName,
                user.getRole().name(),
                user.isEnabled(),
                profileId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getPublicDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> new DepartmentResponse(
                        d.getId(),
                        d.getName(),
                        d.getCode(),
                        studentRepository.countByDepartmentId(d.getId()),
                        facultyRepository.countByDepartmentId(d.getId())
                ))
                .toList();
    }

    private String resolveDisplayName(User user) {
        if (user.getRole() == Role.ADMIN) {
            return "System Administrator";
        } else if (user.getRole() == Role.FACULTY) {
            Optional<Faculty> faculty = facultyRepository.findByUserId(user.getId());
            return faculty.map(Faculty::getName).orElse("Faculty Member");
        } else if (user.getRole() == Role.STUDENT) {
            Optional<Student> student = studentRepository.findByUserId(user.getId());
            return student.map(Student::getName).orElse("Student");
        }
        return user.getEmail();
    }

    private Long resolveProfileId(User user) {
        if (user.getRole() == Role.FACULTY) {
            return facultyRepository.findByUserId(user.getId()).map(Faculty::getId).orElse(null);
        } else if (user.getRole() == Role.STUDENT) {
            return studentRepository.findByUserId(user.getId()).map(Student::getId).orElse(null);
        }
        return null;
    }
}
