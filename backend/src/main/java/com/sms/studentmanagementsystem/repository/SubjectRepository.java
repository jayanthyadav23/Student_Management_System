package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    Optional<Subject> findByCode(String code);

    boolean existsByCode(String code);

    List<Subject> findByDepartmentId(Long departmentId);

    List<Subject> findByFacultyId(Long facultyId);

    List<Subject> findByCourseId(Long courseId);

    boolean existsByCourseIdAndFacultyId(Long courseId, Long facultyId);

    List<Subject> findByDepartmentIdAndSemester(Long departmentId, Integer semester);

    @Query("SELECT s FROM Subject s WHERE " +
           "LOWER(s.code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Subject> searchSubjects(@Param("query") String query);

    long countByStatus(String status);
}
