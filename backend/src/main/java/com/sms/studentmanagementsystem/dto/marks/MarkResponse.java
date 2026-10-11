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
        Double percentage
) {}
