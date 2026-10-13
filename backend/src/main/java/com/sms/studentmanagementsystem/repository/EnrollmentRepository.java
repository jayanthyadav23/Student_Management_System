package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c JOIN FETCH c.department LEFT JOIN FETCH c.faculty WHERE e.student.id = :studentId")
    List<Enrollment> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student s LEFT JOIN FETCH s.department JOIN FETCH e.course c LEFT JOIN FETCH c.faculty WHERE e.course.id = :courseId ORDER BY s.name ASC")
    List<Enrollment> findByCourseId(@Param("courseId") Long courseId);

    @Query(
            value = "SELECT e FROM Enrollment e JOIN FETCH e.student s LEFT JOIN FETCH s.department JOIN FETCH e.course c LEFT JOIN FETCH c.faculty WHERE e.course.id = :courseId",
            countQuery = "SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId"
    )
    Page<Enrollment> findByCourseIdPaged(@Param("courseId") Long courseId, Pageable pageable);

    long countByCourseId(Long courseId);

    long countByStudentId(Long studentId);
}
