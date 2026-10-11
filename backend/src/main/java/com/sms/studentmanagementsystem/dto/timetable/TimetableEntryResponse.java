package com.sms.studentmanagementsystem.dto.timetable;

public record TimetableEntryResponse(
        Long id,
        String dayOfWeek,
        String startTime,
        String endTime,
        String roomNumber,
        Long departmentId,
        String departmentName,
        Integer semester,
        Long courseId,
        String courseCode,
        String courseTitle,
        Long subjectId,
        String subjectCode,
        String subjectName,
        Long facultyId,
        String facultyName
) {}
