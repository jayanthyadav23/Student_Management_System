package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.department.DepartmentRequest;
import com.sms.studentmanagementsystem.dto.department.DepartmentResponse;

import java.util.List;

public interface DepartmentService {

    DepartmentResponse createDepartment(DepartmentRequest request);

    DepartmentResponse getDepartmentById(Long id);

    PageResponse<DepartmentResponse> getAllDepartments(String search, int page, int size, String sortBy, String sortDir);

    List<DepartmentResponse> getAllDepartmentsDropdown();

    DepartmentResponse updateDepartment(Long id, DepartmentRequest request);

    void deleteDepartment(Long id);
}
