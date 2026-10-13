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

    @Query("SELECT a FROM Attendance a JOIN a.enrollment e WHERE e.course.id = :courseId AND a.date = :date")
    List<Attendance> findByCourseIdAndDate(@Param("courseId") Long courseId, @Param("date") LocalDate date);

    long countByEnrollmentId(Long enrollmentId);

    long countByEnrollmentIdAndStatus(Long enrollmentId, AttendanceStatus status);

    @Query("SELECT a.status, COUNT(a) FROM Attendance a WHERE a.enrollment.id = :enrollmentId GROUP BY a.status")
    List<Object[]> countAttendanceByStatusForEnrollment(@Param("enrollmentId") Long enrollmentId);

    @Query("SELECT e.id, " +
            "COUNT(a.id), " +
            "SUM(CASE WHEN a.status = com.sms.studentmanagementsystem.entity.AttendanceStatus.PRESENT THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = com.sms.studentmanagementsystem.entity.AttendanceStatus.LATE THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = com.sms.studentmanagementsystem.entity.AttendanceStatus.ABSENT THEN 1 ELSE 0 END) " +
            "FROM Enrollment e " +
            "LEFT JOIN e.attendanceRecords a " +
            "WHERE e.course.id = :courseId " +
            "GROUP BY e.id")
    List<Object[]> getCourseAttendanceSummary(@Param("courseId") Long courseId);
}
