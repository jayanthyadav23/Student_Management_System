package com.sms.studentmanagementsystem.dto.marks;

import com.sms.studentmanagementsystem.entity.ExamType;

public record MarkResponse(
        Long id,
        Long enrollmentId,
        Long studentId,
        String studentRollNumber,
        String studentName,
        ExamType examType,
        Double score,
        Double maxScore,
        Double percentage,
        String grade,
        String remarks
) {
    public MarkResponse(Long id, Long enrollmentId, Long studentId, String studentRollNumber, String studentName, ExamType examType, Double score, Double maxScore, Double percentage, String grade) {
        this(id, enrollmentId, studentId, studentRollNumber, studentName, examType, score, maxScore, percentage, grade, "");
    }

    public MarkResponse(Long id, Long enrollmentId, Long studentId, String studentRollNumber, String studentName, ExamType examType, Double score, Double maxScore, Double percentage) {
        this(id, enrollmentId, studentId, studentRollNumber, studentName, examType, score, maxScore, percentage, calculateGrade(percentage), "");
    }

    public static String calculateGrade(Double percentage) {
        if (percentage == null) return "—";
        if (percentage >= 90.0) return "O";
        if (percentage >= 80.0) return "A";
        if (percentage >= 70.0) return "B";
        if (percentage >= 60.0) return "C";
        if (percentage >= 50.0) return "D";
        return "F";
    }
}
