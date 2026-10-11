package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    @Query("SELECT c FROM Course c JOIN FETCH c.department LEFT JOIN FETCH c.faculty WHERE c.faculty.id = :facultyId")
    List<Course> findByFacultyId(@Param("facultyId") Long facultyId);

    @Query(
            value = "SELECT c FROM Course c JOIN FETCH c.department LEFT JOIN FETCH c.faculty WHERE c.faculty.id = :facultyId",
            countQuery = "SELECT COUNT(c) FROM Course c WHERE c.faculty.id = :facultyId"
    )
    Page<Course> findByFacultyId(@Param("facultyId") Long facultyId, Pageable pageable);

    @Query(
            value = "SELECT c FROM Course c JOIN FETCH c.department LEFT JOIN FETCH c.faculty WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%'))",
            countQuery = "SELECT COUNT(c) FROM Course c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%'))"
    )
    Page<Course> searchCourses(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Course c JOIN FETCH c.department LEFT JOIN FETCH c.faculty WHERE c.department.id = :departmentId")
    Page<Course> findByDepartmentId(@Param("departmentId") Long departmentId, Pageable pageable);

    @Query("SELECT c.id, c.code, c.title, COUNT(e) FROM Course c JOIN Enrollment e ON e.course.id = c.id GROUP BY c.id, c.code, c.title ORDER BY COUNT(e) DESC")
    List<Object[]> findTopEnrolledCourses(Pageable pageable);
}
