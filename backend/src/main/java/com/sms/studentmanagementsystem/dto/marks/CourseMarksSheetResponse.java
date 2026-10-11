package com.sms.studentmanagementsystem.dto.marks;

import com.sms.studentmanagementsystem.entity.ExamType;

import java.util.List;

public record CourseMarksSheetResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        ExamType examType,
        Double maxScore,
        int totalEnrolled,
        int gradedCount,
        Double classAverage,
        List<MarkResponse> marks
) {}
