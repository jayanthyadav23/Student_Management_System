package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByRollNumber(String rollNumber);

    boolean existsByRollNumber(String rollNumber);

    boolean existsByRollNumberAndIdNot(String rollNumber, Long id);

    Optional<Student> findByUserId(Long userId);

    @Query("SELECT s FROM Student s JOIN FETCH s.department JOIN FETCH s.user WHERE s.user.email = :email")
    Optional<Student> findByUserEmail(@Param("email") String email);

    @Query(
            value = "SELECT s FROM Student s JOIN FETCH s.department JOIN FETCH s.user WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.user.email) LIKE LOWER(CONCAT('%', :query, '%'))",
            countQuery = "SELECT COUNT(s) FROM Student s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.user.email) LIKE LOWER(CONCAT('%', :query, '%'))"
    )
    Page<Student> searchStudents(@Param("query") String query, Pageable pageable);

    @Query("SELECT s FROM Student s JOIN FETCH s.department JOIN FETCH s.user WHERE s.department.id = :departmentId")
    Page<Student> findByDepartmentId(@Param("departmentId") Long departmentId, Pageable pageable);

    @Query(
            value = "SELECT DISTINCT s FROM Student s " +
                    "JOIN FETCH s.department d " +
                    "JOIN FETCH s.user u " +
                    "WHERE (:departmentId IS NULL OR d.id = :departmentId) " +
                    "AND (:semester IS NULL OR s.semester = :semester) " +
                    "AND (:academicYear IS NULL OR s.academicYear = :academicYear) " +
                    "AND (:section IS NULL OR s.section = :section) " +
                    "AND (:query IS NULL OR (LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))) " +
                    "AND (:courseId IS NULL OR EXISTS (SELECT 1 FROM Enrollment e WHERE e.student = s AND e.course.id = :courseId))",
            countQuery = "SELECT COUNT(DISTINCT s) FROM Student s " +
                    "JOIN s.department d " +
                    "JOIN s.user u " +
                    "WHERE (:departmentId IS NULL OR d.id = :departmentId) " +
                    "AND (:semester IS NULL OR s.semester = :semester) " +
                    "AND (:academicYear IS NULL OR s.academicYear = :academicYear) " +
                    "AND (:section IS NULL OR s.section = :section) " +
                    "AND (:query IS NULL OR (LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))) " +
                    "AND (:courseId IS NULL OR EXISTS (SELECT 1 FROM Enrollment e WHERE e.student = s AND e.course.id = :courseId))"
    )
    Page<Student> findWithFilters(
            @Param("departmentId") Long departmentId,
            @Param("semester") Integer semester,
            @Param("academicYear") String academicYear,
            @Param("section") String section,
            @Param("query") String query,
            @Param("courseId") Long courseId,
            Pageable pageable
    );

    @Query(
            value = "SELECT DISTINCT s FROM Student s " +
                    "JOIN FETCH s.department d " +
                    "JOIN FETCH s.user u " +
                    "WHERE (:departmentId IS NULL OR d.id = :departmentId) " +
                    "AND (:semester IS NULL OR s.semester = :semester) " +
                    "AND (:academicYear IS NULL OR s.academicYear = :academicYear) " +
                    "AND (:section IS NULL OR s.section = :section) " +
                    "AND (:query IS NULL OR (LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))) " +
                    "AND (:courseId IS NULL OR EXISTS (SELECT 1 FROM Enrollment e WHERE e.student = s AND e.course.id = :courseId))"
    )
    List<Student> findListWithFilters(
            @Param("departmentId") Long departmentId,
            @Param("semester") Integer semester,
            @Param("academicYear") String academicYear,
            @Param("section") String section,
            @Param("query") String query,
            @Param("courseId") Long courseId
    );

    long countByDepartmentId(Long departmentId);

    @Query("SELECT s.department.name, COUNT(s) FROM Student s GROUP BY s.department.name")
    List<Object[]> countStudentsPerDepartment();
}
