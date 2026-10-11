package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.ExamType;
import com.sms.studentmanagementsystem.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarkRepository extends JpaRepository<Mark, Long> {

    Optional<Mark> findByEnrollmentIdAndExamType(Long enrollmentId, ExamType examType);

    boolean existsByEnrollmentIdAndExamType(Long enrollmentId, ExamType examType);

    List<Mark> findByEnrollmentId(Long enrollmentId);

    @Query("SELECT m FROM Mark m JOIN FETCH m.enrollment e JOIN FETCH e.student s WHERE e.course.id = :courseId AND m.examType = :examType")
    List<Mark> findByCourseIdAndExamType(@Param("courseId") Long courseId, @Param("examType") ExamType examType);

    @Query("SELECT m FROM Mark m JOIN FETCH m.enrollment e JOIN FETCH e.student s WHERE e.course.id = :courseId")
    List<Mark> findByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT m.examType, m.score, m.maxScore FROM Mark m WHERE m.enrollment.id = :enrollmentId")
    List<Object[]> findScoresByEnrollmentId(@Param("enrollmentId") Long enrollmentId);
}
