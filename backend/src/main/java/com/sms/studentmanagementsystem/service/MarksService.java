package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.marks.BatchMarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.CourseMarksSheetResponse;
import com.sms.studentmanagementsystem.dto.marks.MarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.MarkResponse;
import com.sms.studentmanagementsystem.entity.ExamType;

import java.util.List;

public interface MarksService {

    MarkResponse recordOrUpdateMark(Long courseId, MarkEntryRequest request, String userEmail);

    CourseMarksSheetResponse recordBatchMarks(Long courseId, BatchMarkEntryRequest request, String userEmail);

    CourseMarksSheetResponse getCourseMarksSheet(Long courseId, ExamType examType, String userEmail);

    List<MarkResponse> getMarksByEnrollment(Long enrollmentId, String userEmail);
}
