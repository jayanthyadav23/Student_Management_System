package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectCreateRequest;
import com.sms.studentmanagementsystem.dto.subject.SubjectResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectUpdateRequest;
import com.sms.studentmanagementsystem.entity.Course;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.entity.Faculty;
import com.sms.studentmanagementsystem.entity.Subject;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.repository.SubjectRepository;
import com.sms.studentmanagementsystem.service.SubjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;

    public SubjectServiceImpl(SubjectRepository subjectRepository,
                              DepartmentRepository departmentRepository,
                              CourseRepository courseRepository,
                              FacultyRepository facultyRepository) {
        this.subjectRepository = subjectRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
    }

    @Override
    @Transactional
    public SubjectResponse createSubject(SubjectCreateRequest request) {
        String cleanCode = request.code().trim().toUpperCase();
        if (subjectRepository.existsByCode(cleanCode)) {
            throw new DuplicateResourceException("Subject with code '" + cleanCode + "' already exists");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Course course = null;
        if (request.courseId() != null) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.courseId()));
        }

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
        }

        Subject subject = new Subject(
                cleanCode,
                request.name().trim(),
                request.credits(),
                request.type(),
                department,
                course,
                faculty,
                request.semester()
        );

        Subject saved = subjectRepository.save(subject);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
        return mapToResponse(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects(String search, Long departmentId, Long courseId, Long facultyId, Integer semester) {
        List<Subject> list;
        if (search != null && !search.trim().isEmpty()) {
            list = subjectRepository.searchSubjects(search.trim());
        } else if (facultyId != null) {
            list = subjectRepository.findByFacultyId(facultyId);
        } else if (courseId != null) {
            list = subjectRepository.findByCourseId(courseId);
        } else if (departmentId != null && semester != null) {
            list = subjectRepository.findByDepartmentIdAndSemester(departmentId, semester);
        } else if (departmentId != null) {
            list = subjectRepository.findByDepartmentId(departmentId);
        } else {
            list = subjectRepository.findAll();
        }

        return list.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SubjectResponse> getAllSubjectsPaged(String search, Long departmentId, Long courseId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Subject> subjectPage = subjectRepository.findAll(pageable);
        List<SubjectResponse> responses = subjectPage.getContent().stream().map(this::mapToResponse).toList();
        return PageResponse.of(responses, subjectPage);
    }

    @Override
    @Transactional
    public SubjectResponse updateSubject(Long id, SubjectUpdateRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));

        String cleanCode = request.code().trim().toUpperCase();
        if (!subject.getCode().equalsIgnoreCase(cleanCode) && subjectRepository.existsByCode(cleanCode)) {
            throw new DuplicateResourceException("Subject with code '" + cleanCode + "' already exists");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Course course = null;
        if (request.courseId() != null) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.courseId()));
        }

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
        }

        subject.setCode(cleanCode);
        subject.setName(request.name().trim());
        subject.setCredits(request.credits());
        if (request.type() != null) subject.setType(request.type());
        subject.setDepartment(department);
        subject.setCourse(course);
        subject.setFaculty(faculty);
        subject.setSemester(request.semester());
        if (request.status() != null) subject.setStatus(request.status());

        Subject saved = subjectRepository.save(subject);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SubjectResponse assignFacultyToSubject(Long subjectId, Long facultyId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", subjectId));

        Faculty faculty = null;
        if (facultyId != null && facultyId > 0) {
            faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", facultyId));
        }

        subject.setFaculty(faculty);
        return mapToResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public SubjectResponse assignCourseToSubject(Long subjectId, Long courseId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", subjectId));

        Course course = null;
        if (courseId != null && courseId > 0) {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        }

        subject.setCourse(course);
        return mapToResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public void deleteSubject(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
        subjectRepository.delete(subject);
    }

    @Override
    @Transactional
    public SubjectResponse toggleSubjectStatus(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
        String newStatus = "ACTIVE".equalsIgnoreCase(subject.getStatus()) ? "ARCHIVED" : "ACTIVE";
        subject.setStatus(newStatus);
        return mapToResponse(subjectRepository.save(subject));
    }

    private SubjectResponse mapToResponse(Subject subject) {
        String courseCode = subject.getCourse() != null ? subject.getCourse().getCode() : null;
        String courseTitle = subject.getCourse() != null ? subject.getCourse().getTitle() : null;
        Long courseId = subject.getCourse() != null ? subject.getCourse().getId() : null;

        String facultyName = subject.getFaculty() != null ? subject.getFaculty().getName() : "Unassigned";
        Long facultyId = subject.getFaculty() != null ? subject.getFaculty().getId() : null;

        return new SubjectResponse(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.getCredits(),
                subject.getType(),
                subject.getDepartment().getId(),
                subject.getDepartment().getName(),
                subject.getDepartment().getCode(),
                courseId,
                courseCode,
                courseTitle,
                facultyId,
                facultyName,
                subject.getSemester(),
                subject.getStatus(),
                subject.getCreatedAt()
        );
    }
}
