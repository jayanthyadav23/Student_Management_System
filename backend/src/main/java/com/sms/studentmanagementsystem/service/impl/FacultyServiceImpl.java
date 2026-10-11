package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyCreateRequest;
import com.sms.studentmanagementsystem.dto.faculty.FacultyResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyUpdateRequest;
import com.sms.studentmanagementsystem.entity.Course;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.entity.Faculty;
import com.sms.studentmanagementsystem.entity.Role;
import com.sms.studentmanagementsystem.entity.User;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.repository.UserRepository;
import com.sms.studentmanagementsystem.service.FacultyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FacultyServiceImpl implements FacultyService {

    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final com.sms.studentmanagementsystem.repository.SubjectRepository subjectRepository;
    private final com.sms.studentmanagementsystem.service.AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public FacultyServiceImpl(FacultyRepository facultyRepository,
                              UserRepository userRepository,
                              DepartmentRepository departmentRepository,
                              CourseRepository courseRepository,
                              com.sms.studentmanagementsystem.repository.SubjectRepository subjectRepository,
                              com.sms.studentmanagementsystem.service.AuditLogService auditLogService,
                              PasswordEncoder passwordEncoder) {
        this.facultyRepository = facultyRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public FacultyResponse createFaculty(FacultyCreateRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("User", "email", cleanEmail);
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

        Faculty faculty = new Faculty(
                savedUser,
                request.name().trim(),
                request.designation().trim(),
                department
        );

        if (request.specialization() != null && !request.specialization().isBlank()) {
            faculty.setSpecialization(request.specialization().trim());
        }
        if (request.phone() != null) {
            faculty.setPhone(request.phone().trim());
        }
        if (request.officeRoom() != null) {
            faculty.setOfficeRoom(request.officeRoom().trim());
        }

        Faculty savedFaculty = facultyRepository.save(faculty);
        auditLogService.logAction("CREATE_FACULTY", "Admin", "Faculty " + savedFaculty.getName(), "Added faculty member: " + savedFaculty.getName());
        return mapToResponse(savedFaculty);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyResponse getFacultyById(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));

        return mapToResponse(faculty);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FacultyResponse> getAllFaculty(String search, Long departmentId, int page, int size, String sortBy, String sortDir) {
        String effectiveSortBy = "name";
        if ("id".equalsIgnoreCase(sortBy) || "name".equalsIgnoreCase(sortBy) || "designation".equalsIgnoreCase(sortBy)) {
            effectiveSortBy = sortBy.toLowerCase();
        }
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(effectiveSortBy).descending() : Sort.by(effectiveSortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Faculty> facultyPage;
        if (search != null && !search.trim().isEmpty()) {
            facultyPage = facultyRepository.searchFaculty(search.trim(), pageable);
        } else if (departmentId != null) {
            facultyPage = facultyRepository.findByDepartmentId(departmentId, pageable);
        } else {
            facultyPage = facultyRepository.findAll(pageable);
        }

        List<FacultyResponse> responseList = facultyPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(responseList, facultyPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFacultyDropdown(Long departmentId) {
        List<Faculty> list;
        if (departmentId != null) {
            list = facultyRepository.findByDepartmentId(departmentId, Pageable.unpaged()).getContent();
        } else {
            list = facultyRepository.findAll(Sort.by("name").ascending());
        }

        return list.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public FacultyResponse updateFaculty(Long id, FacultyUpdateRequest request) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        faculty.setName(request.name().trim());
        faculty.setDesignation(request.designation().trim());
        faculty.setDepartment(department);

        if (request.specialization() != null && !request.specialization().isBlank()) {
            faculty.setSpecialization(request.specialization().trim());
        }
        if (request.status() != null && !request.status().isBlank()) {
            faculty.setStatus(request.status().trim().toUpperCase());
        }
        if (request.phone() != null) {
            faculty.setPhone(request.phone().trim());
        }
        if (request.officeRoom() != null) {
            faculty.setOfficeRoom(request.officeRoom().trim());
        }

        Faculty updated = facultyRepository.save(faculty);
        auditLogService.logAction("UPDATE_FACULTY", "Admin", "Faculty " + updated.getName(), "Updated profile for: " + updated.getName());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));

        List<Course> assignedCourses = courseRepository.findByFacultyId(id);
        for (Course course : assignedCourses) {
            course.setFaculty(null);
            courseRepository.save(course);
        }

        List<com.sms.studentmanagementsystem.entity.Subject> assignedSubjects = subjectRepository.findByFacultyId(id);
        for (com.sms.studentmanagementsystem.entity.Subject sub : assignedSubjects) {
            sub.setFaculty(null);
            subjectRepository.save(sub);
        }

        User user = faculty.getUser();
        String name = faculty.getName();
        facultyRepository.delete(faculty);
        if (user != null) {
            userRepository.delete(user);
        }

        auditLogService.logAction("DELETE_FACULTY", "Admin", "Faculty " + name, "Deleted faculty record");
    }

    @Override
    @Transactional
    public FacultyResponse toggleFacultyStatus(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));

        String currentStatus = faculty.getStatus();
        String nextStatus = "ACTIVE".equalsIgnoreCase(currentStatus) ? "INACTIVE" : "ACTIVE";
        faculty.setStatus(nextStatus);

        if (faculty.getUser() != null) {
            faculty.getUser().setEnabled("ACTIVE".equalsIgnoreCase(nextStatus));
            userRepository.save(faculty.getUser());
        }

        Faculty saved = facultyRepository.save(faculty);
        auditLogService.logAction("STATUS_CHANGE", "Admin", "Faculty " + faculty.getName(), "Changed status to: " + nextStatus);
        return mapToResponse(saved);
    }

    private FacultyResponse mapToResponse(Faculty faculty) {
        int assignedCoursesCount = courseRepository.findByFacultyId(faculty.getId()).size();
        int assignedSubjectsCount = subjectRepository.findByFacultyId(faculty.getId()).size();

        return new FacultyResponse(
                faculty.getId(),
                faculty.getUser().getId(),
                faculty.getName(),
                faculty.getUser().getEmail(),
                faculty.getDesignation(),
                faculty.getSpecialization(),
                faculty.getStatus(),
                faculty.getPhone(),
                faculty.getOfficeRoom(),
                faculty.getDepartment().getId(),
                faculty.getDepartment().getName(),
                faculty.getDepartment().getCode(),
                faculty.getUser().isEnabled(),
                assignedCoursesCount,
                assignedSubjectsCount
        );
    }
}
