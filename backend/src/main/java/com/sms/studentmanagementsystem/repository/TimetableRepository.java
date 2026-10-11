package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {

    List<TimetableEntry> findByDepartmentIdAndSemester(Long departmentId, Integer semester);

    List<TimetableEntry> findByFacultyId(Long facultyId);

    List<TimetableEntry> findByCourseId(Long courseId);

    List<TimetableEntry> findByDayOfWeek(String dayOfWeek);
}
