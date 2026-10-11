package com.sms.studentmanagementsystem.dto.student;

import com.sms.studentmanagementsystem.dto.marks.MarkResponse;

import java.util.List;

public record StudentCourseResultResponse(
        Long courseId,
        String courseCode,
        String courseTitle,
        Integer credits,
        Double totalScoreObtained,
        Double totalMaxScore,
        Double percentage,
        String grade,
        String status,
        List<MarkResponse> marks
) {}
