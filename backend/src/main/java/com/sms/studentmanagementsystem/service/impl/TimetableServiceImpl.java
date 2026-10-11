package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryRequest;
import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryResponse;
import com.sms.studentmanagementsystem.entity.Course;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.entity.Faculty;
import com.sms.studentmanagementsystem.entity.Subject;
import com.sms.studentmanagementsystem.entity.TimetableEntry;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.repository.SubjectRepository;
import com.sms.studentmanagementsystem.repository.TimetableRepository;
import com.sms.studentmanagementsystem.service.TimetableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;

    public TimetableServiceImpl(TimetableRepository timetableRepository,
                                DepartmentRepository departmentRepository,
                                CourseRepository courseRepository,
                                SubjectRepository subjectRepository,
                                FacultyRepository facultyRepository) {
        this.timetableRepository = timetableRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.facultyRepository = facultyRepository;
    }

    @Override
    @Transactional
    public TimetableEntryResponse createEntry(TimetableEntryRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Course course = null;
        if (request.courseId() != null) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.courseId()));
        }

        Subject subject = null;
        if (request.subjectId() != null) {
            subject = subjectRepository.findById(request.subjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", request.subjectId()));
        }

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
        }

        TimetableEntry entry = new TimetableEntry(
                request.dayOfWeek().trim().toUpperCase(),
                request.startTime().trim(),
                request.endTime().trim(),
                request.roomNumber() != null ? request.roomNumber().trim() : "Room 101",
                department,
                request.semester(),
                course,
                subject,
                faculty
        );

        return mapToResponse(timetableRepository.save(entry));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableEntryResponse> getTimetable(Long departmentId, Integer semester, Long facultyId, Long courseId) {
        List<TimetableEntry> entries;
        if (facultyId != null) {
            entries = timetableRepository.findByFacultyId(facultyId);
        } else if (courseId != null) {
            entries = timetableRepository.findByCourseId(courseId);
        } else if (departmentId != null && semester != null) {
            entries = timetableRepository.findByDepartmentIdAndSemester(departmentId, semester);
        } else {
            entries = timetableRepository.findAll();
        }

        return entries.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public TimetableEntryResponse updateEntry(Long id, TimetableEntryRequest request) {
        TimetableEntry entry = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", "id", id));

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        Course course = null;
        if (request.courseId() != null) {
            course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.courseId()));
        }

        Subject subject = null;
        if (request.subjectId() != null) {
            subject = subjectRepository.findById(request.subjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", request.subjectId()));
        }

        Faculty faculty = null;
        if (request.facultyId() != null) {
            faculty = facultyRepository.findById(request.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.facultyId()));
        }

        entry.setDayOfWeek(request.dayOfWeek().trim().toUpperCase());
        entry.setStartTime(request.startTime().trim());
        entry.setEndTime(request.endTime().trim());
        entry.setRoomNumber(request.roomNumber() != null ? request.roomNumber().trim() : "Room 101");
        entry.setDepartment(department);
        entry.setSemester(request.semester());
        entry.setCourse(course);
        entry.setSubject(subject);
        entry.setFaculty(faculty);

        return mapToResponse(timetableRepository.save(entry));
    }

    @Override
    @Transactional
    public void deleteEntry(Long id) {
        TimetableEntry entry = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", "id", id));
        timetableRepository.delete(entry);
    }

    private TimetableEntryResponse mapToResponse(TimetableEntry e) {
        String courseCode = e.getCourse() != null ? e.getCourse().getCode() : null;
        String courseTitle = e.getCourse() != null ? e.getCourse().getTitle() : null;
        Long courseId = e.getCourse() != null ? e.getCourse().getId() : null;

        String subjectCode = e.getSubject() != null ? e.getSubject().getCode() : null;
        String subjectName = e.getSubject() != null ? e.getSubject().getName() : null;
        Long subjectId = e.getSubject() != null ? e.getSubject().getId() : null;

        String facultyName = e.getFaculty() != null ? e.getFaculty().getName() : "Unassigned";
        Long facultyId = e.getFaculty() != null ? e.getFaculty().getId() : null;

        return new TimetableEntryResponse(
                e.getId(),
                e.getDayOfWeek(),
                e.getStartTime(),
                e.getEndTime(),
                e.getRoomNumber(),
                e.getDepartment().getId(),
                e.getDepartment().getName(),
                e.getSemester(),
                courseId,
                courseCode,
                courseTitle,
                subjectId,
                subjectCode,
                subjectName,
                facultyId,
                facultyName
        );
    }
}
