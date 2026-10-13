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
        List<MarkResponse> marks,
        List<MarkResponse> entries
) {
    public CourseMarksSheetResponse(Long courseId, String courseCode, String courseTitle, ExamType examType, Double maxScore, int totalEnrolled, int gradedCount, Double classAverage, List<MarkResponse> marks) {
        this(courseId, courseCode, courseTitle, examType, maxScore, totalEnrolled, gradedCount, classAverage, marks, marks);
    }
}
