package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyCreateRequest;
import com.sms.studentmanagementsystem.dto.faculty.FacultyResponse;
import com.sms.studentmanagementsystem.dto.faculty.FacultyUpdateRequest;

import java.util.List;

public interface FacultyService {

    FacultyResponse createFaculty(FacultyCreateRequest request);

    FacultyResponse getFacultyById(Long id);

    PageResponse<FacultyResponse> getAllFaculty(String search, Long departmentId, int page, int size, String sortBy, String sortDir);

    List<FacultyResponse> getAllFacultyDropdown(Long departmentId);

    FacultyResponse updateFaculty(Long id, FacultyUpdateRequest request);

    void deleteFaculty(Long id);
}
