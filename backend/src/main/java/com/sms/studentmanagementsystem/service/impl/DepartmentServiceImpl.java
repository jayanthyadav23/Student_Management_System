package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.PageResponse;
import com.sms.studentmanagementsystem.dto.department.DepartmentRequest;
import com.sms.studentmanagementsystem.dto.department.DepartmentResponse;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.exception.BadRequestException;
import com.sms.studentmanagementsystem.exception.DuplicateResourceException;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.repository.FacultyRepository;
import com.sms.studentmanagementsystem.repository.StudentRepository;
import com.sms.studentmanagementsystem.service.DepartmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository,
                                 StudentRepository studentRepository,
                                 FacultyRepository facultyRepository) {
        this.departmentRepository = departmentRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
    }

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        String cleanCode = request.code().trim().toUpperCase();
        String cleanName = request.name().trim();

        if (departmentRepository.existsByCode(cleanCode)) {
            throw new DuplicateResourceException("Department", "code", cleanCode);
        }

        if (departmentRepository.existsByName(cleanName)) {
            throw new DuplicateResourceException("Department", "name", cleanName);
        }

        Department department = new Department(cleanName, cleanCode);
        Department saved = departmentRepository.save(department);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        return mapToResponse(department);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DepartmentResponse> getAllDepartments(String search, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Department> departmentPage;
        if (search != null && !search.trim().isEmpty()) {
            departmentPage = departmentRepository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(
                    search.trim(),
                    search.trim(),
                    pageable
            );
        } else {
            departmentPage = departmentRepository.findAll(pageable);
        }

        List<DepartmentResponse> responseList = departmentPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(responseList, departmentPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartmentsDropdown() {
        return departmentRepository.findAll(Sort.by("name").ascending()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        String cleanCode = request.code().trim().toUpperCase();
        String cleanName = request.name().trim();

        if (departmentRepository.existsByCodeAndIdNot(cleanCode, id)) {
            throw new DuplicateResourceException("Department", "code", cleanCode);
        }

        if (departmentRepository.existsByNameAndIdNot(cleanName, id)) {
            throw new DuplicateResourceException("Department", "name", cleanName);
        }

        department.setCode(cleanCode);
        department.setName(cleanName);

        Department updated = departmentRepository.save(department);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        long studentCount = studentRepository.countByDepartmentId(id);
        if (studentCount > 0) {
            throw new BadRequestException("Cannot delete department '" + department.getName() + "' because "
                    + studentCount + " student(s) are assigned to it.");
        }

        long facultyCount = facultyRepository.countByDepartmentId(id);
        if (facultyCount > 0) {
            throw new BadRequestException("Cannot delete department '" + department.getName() + "' because "
                    + facultyCount + " faculty member(s) are assigned to it.");
        }

        departmentRepository.delete(department);
    }

    private DepartmentResponse mapToResponse(Department department) {
        long studentCount = studentRepository.countByDepartmentId(department.getId());
        long facultyCount = facultyRepository.countByDepartmentId(department.getId());

        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getCode(),
                studentCount,
                facultyCount
        );
    }
}
