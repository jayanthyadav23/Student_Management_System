package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Attendance;
import com.sms.studentmanagementsystem.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a WHERE a.enrollment.id = :enrollmentId AND a.date = :date")
    Optional<Attendance> findByEnrollmentIdAndDate(@Param("enrollmentId") Long enrollmentId, @Param("date") LocalDate date);

    boolean existsByEnrollmentIdAndDate(Long enrollmentId, LocalDate date);

    List<Attendance> findByEnrollmentIdOrderByDateDesc(Long enrollmentId);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.enrollment e JOIN FETCH e.student WHERE e.course.id = :courseId AND a.date = :date")
    List<Attendance> findByCourseIdAndDate(@Param("courseId") Long courseId, @Param("date") LocalDate date);

    long countByEnrollmentId(Long enrollmentId);

    long countByEnrollmentIdAndStatus(Long enrollmentId, AttendanceStatus status);

    @Query("SELECT a.status, COUNT(a) FROM Attendance a WHERE a.enrollment.id = :enrollmentId GROUP BY a.status")
    List<Object[]> countAttendanceByStatusForEnrollment(@Param("enrollmentId") Long enrollmentId);

    @Query("SELECT e.id, e.student.id, e.student.rollNumber, e.student.name, " +
            "COUNT(a), " +
            "SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) " +
            "FROM Enrollment e " +
            "LEFT JOIN Attendance a ON a.enrollment.id = e.id " +
            "WHERE e.course.id = :courseId " +
            "GROUP BY e.id, e.student.id, e.student.rollNumber, e.student.name")
    List<Object[]> getCourseAttendanceSummary(@Param("courseId") Long courseId);
}
