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

    public CourseServiceImpl(CourseRepository courseRepository,
                             DepartmentRepository departmentRepository,
                             FacultyRepository facultyRepository,
                             EnrollmentRepository enrollmentRepository) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.facultyRepository = facultyRepository;
        this.enrollmentRepository = enrollmentRepository;
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
        }

        Course course = new Course(
                cleanCode,
                request.title().trim(),
                request.credits(),
                department,
                faculty,
                request.semester()
        );

        Course saved = courseRepository.save(course);
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
        }

        course.setCode(cleanCode);
        course.setTitle(request.title().trim());
        course.setCredits(request.credits());
        course.setDepartment(department);
        course.setFaculty(faculty);
        course.setSemester(request.semester());

        Course updated = courseRepository.save(course);
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
            course.setFaculty(faculty);
        } else {
            course.setFaculty(null);
        }

        Course updated = courseRepository.save(course);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        long enrolledCount = enrollmentRepository.countByCourseId(id);
        if (enrolledCount > 0) {
            throw new BadRequestException("Cannot delete course '" + course.getTitle() + "' because "
                    + enrolledCount + " student(s) are actively enrolled in it.");
        }

        courseRepository.delete(course);
    }

    private CourseResponse mapToResponse(Course course) {
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
}
