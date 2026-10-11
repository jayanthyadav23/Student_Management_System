package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectCreateRequest;
import com.sms.studentmanagementsystem.dto.subject.SubjectResponse;
import com.sms.studentmanagementsystem.dto.subject.SubjectUpdateRequest;

import java.util.List;

public interface SubjectService {

    SubjectResponse createSubject(SubjectCreateRequest request);

    SubjectResponse getSubjectById(Long id);

    List<SubjectResponse> getAllSubjects(String search, Long departmentId, Long courseId, Long facultyId, Integer semester);

    PageResponse<SubjectResponse> getAllSubjectsPaged(String search, Long departmentId, Long courseId, int page, int size, String sortBy, String sortDir);

    SubjectResponse updateSubject(Long id, SubjectUpdateRequest request);

    SubjectResponse assignFacultyToSubject(Long subjectId, Long facultyId);

    SubjectResponse assignCourseToSubject(Long subjectId, Long courseId);

    void deleteSubject(Long id);

    SubjectResponse toggleSubjectStatus(Long id);
}
