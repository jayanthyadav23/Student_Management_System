package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.marks.BatchMarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.CourseMarksSheetResponse;
import com.sms.studentmanagementsystem.dto.marks.MarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.MarkResponse;
import com.sms.studentmanagementsystem.dto.marks.StudentMarkEntry;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.exception.UnauthorizedAccessException;
import com.sms.studentmanagementsystem.repository.CourseRepository;
import com.sms.studentmanagementsystem.repository.EnrollmentRepository;
import com.sms.studentmanagementsystem.repository.MarkRepository;
import com.sms.studentmanagementsystem.repository.UserRepository;
import com.sms.studentmanagementsystem.service.MarksService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MarksServiceImpl implements MarksService {

    private final MarkRepository markRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public MarksServiceImpl(MarkRepository markRepository,
                            CourseRepository courseRepository,
                            EnrollmentRepository enrollmentRepository,
                            UserRepository userRepository) {
        this.markRepository = markRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public MarkResponse recordOrUpdateMark(Long courseId, MarkEntryRequest request, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        if (request.score() > request.maxScore()) {
            throw new BadRequestException("Score (" + request.score() + ") cannot exceed maximum score (" + request.maxScore() + ")");
        }

        Enrollment enrollment = enrollmentRepository.findById(request.enrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", request.enrollmentId()));

        if (!enrollment.getCourse().getId().equals(courseId)) {
            throw new BadRequestException("Enrollment ID " + request.enrollmentId() + " does not belong to course " + course.getCode());
        }

        Mark mark;
        Optional<Mark> existing = markRepository.findByEnrollmentIdAndExamType(request.enrollmentId(), request.examType());
        if (existing.isPresent()) {
            mark = existing.get();
            mark.setScore(request.score());
            mark.setMaxScore(request.maxScore());
        } else {
            mark = new Mark(enrollment, request.examType(), request.score(), request.maxScore());
        }

        Mark saved = markRepository.save(mark);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CourseMarksSheetResponse recordBatchMarks(Long courseId, BatchMarkEntryRequest request, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        for (StudentMarkEntry entry : request.entries()) {
            double effectiveMaxScore = (entry.maxScore() != null && entry.maxScore() > 0)
                    ? entry.maxScore()
                    : request.defaultMaxScore();

            if (entry.score() > effectiveMaxScore) {
                throw new BadRequestException("Score (" + entry.score() + ") cannot exceed maximum score (" + effectiveMaxScore + ") for enrollment ID: " + entry.enrollmentId());
            }

            Enrollment enrollment = enrollmentRepository.findById(entry.enrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", entry.enrollmentId()));

            if (!enrollment.getCourse().getId().equals(courseId)) {
                throw new BadRequestException("Enrollment ID " + entry.enrollmentId() + " does not belong to course " + course.getCode());
            }

            Optional<Mark> existing = markRepository.findByEnrollmentIdAndExamType(entry.enrollmentId(), request.examType());
            if (existing.isPresent()) {
                Mark mark = existing.get();
                mark.setScore(entry.score());
                mark.setMaxScore(effectiveMaxScore);
                markRepository.save(mark);
            } else {
                Mark mark = new Mark(enrollment, request.examType(), entry.score(), effectiveMaxScore);
                markRepository.save(mark);
            }
        }

        return getCourseMarksSheet(courseId, request.examType(), userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseMarksSheetResponse getCourseMarksSheet(Long courseId, ExamType examType, String userEmail) {
        Course course = getCourseById(courseId);
        validateCourseAccess(course, userEmail);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<Mark> existingMarks = (examType != null)
                ? markRepository.findByCourseIdAndExamType(courseId, examType)
                : markRepository.findByCourseId(courseId);

        Map<Long, Mark> marksMap = existingMarks.stream()
                .collect(Collectors.toMap(m -> m.getEnrollment().getId(), m -> m, (m1, m2) -> m1));

        List<MarkResponse> markResponses = new ArrayList<>();
        double totalScore = 0.0;
        int gradedCount = 0;
        double defaultMax = 100.0;

        for (Enrollment enrollment : enrollments) {
            Mark mark = marksMap.get(enrollment.getId());
            if (mark != null) {
                defaultMax = mark.getMaxScore();
                gradedCount++;
                totalScore += mark.getScore();
                markResponses.add(mapToResponse(mark));
            } else {
                markResponses.add(new MarkResponse(
                        null,
                        enrollment.getId(),
                        enrollment.getStudent().getId(),
                        enrollment.getStudent().getRollNumber(),
                        enrollment.getStudent().getName(),
                        examType,
                        0.0,
                        defaultMax,
                        0.0
                ));
            }
        }

        Double classAverage = (gradedCount > 0)
                ? Math.round((totalScore / gradedCount) * 100.0) / 100.0
                : 0.0;

        return new CourseMarksSheetResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                examType,
                defaultMax,
                enrollments.size(),
                gradedCount,
                classAverage,
                markResponses
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarkResponse> getMarksByEnrollment(Long enrollmentId, String userEmail) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));

        User user = getUserByEmail(userEmail);
        if (user.getRole() == Role.FACULTY) {
            Course course = enrollment.getCourse();
            validateCourseAccess(course, userEmail);
        } else if (user.getRole() == Role.STUDENT) {
            if (!enrollment.getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
                throw new UnauthorizedAccessException("You can only view your own marks records");
            }
        }

        List<Mark> marks = markRepository.findByEnrollmentId(enrollmentId);
        return marks.stream().map(this::mapToResponse).toList();
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

    private MarkResponse mapToResponse(Mark mark) {
        double percentage = (mark.getMaxScore() > 0)
                ? Math.round((mark.getScore() / mark.getMaxScore() * 100.0) * 100.0) / 100.0
                : 0.0;

        return new MarkResponse(
                mark.getId(),
                mark.getEnrollment().getId(),
                mark.getEnrollment().getStudent().getId(),
                mark.getEnrollment().getStudent().getRollNumber(),
                mark.getEnrollment().getStudent().getName(),
                mark.getExamType(),
                mark.getScore(),
                mark.getMaxScore(),
                percentage
        );
    }
}
