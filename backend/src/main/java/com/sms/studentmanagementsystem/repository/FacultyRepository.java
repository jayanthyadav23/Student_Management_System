package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Faculty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {

    Optional<Faculty> findByUserId(Long userId);

    @Query("SELECT f FROM Faculty f JOIN FETCH f.user JOIN FETCH f.department WHERE f.user.email = :email")
    Optional<Faculty> findByUserEmail(@Param("email") String email);

    @Query(
            value = "SELECT f FROM Faculty f JOIN FETCH f.department JOIN FETCH f.user WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(f.designation) LIKE LOWER(CONCAT('%', :query, '%'))",
            countQuery = "SELECT COUNT(f) FROM Faculty f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(f.designation) LIKE LOWER(CONCAT('%', :query, '%'))"
    )
    Page<Faculty> searchFaculty(@Param("query") String query, Pageable pageable);

    Page<Faculty> findByDepartmentId(Long departmentId, Pageable pageable);

    long countByDepartmentId(Long departmentId);
}
