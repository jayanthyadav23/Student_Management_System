package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.announcement.AnnouncementRequest;
import com.sms.studentmanagementsystem.dto.announcement.AnnouncementResponse;
import com.sms.studentmanagementsystem.entity.Announcement;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.exception.ResourceNotFoundException;
import com.sms.studentmanagementsystem.repository.AnnouncementRepository;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import com.sms.studentmanagementsystem.service.AnnouncementService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final DepartmentRepository departmentRepository;

    public AnnouncementServiceImpl(AnnouncementRepository announcementRepository,
                                   DepartmentRepository departmentRepository) {
        this.announcementRepository = announcementRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request) {
        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));
        }

        String author = "College Administration";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            author = auth.getName();
        }

        boolean isPinned = request.pinned() != null && request.pinned();

        Announcement announcement = new Announcement(
                request.title().trim(),
                request.content().trim(),
                request.targetRole(),
                request.category(),
                department,
                author,
                isPinned
        );

        return mapToResponse(announcementRepository.save(announcement));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAllAnnouncements(String role) {
        List<Announcement> announcements;
        if (role != null && !role.isBlank()) {
            announcements = announcementRepository.findByTargetRoleOrderByPinnedDescCreatedAtDesc(role.toUpperCase());
        } else {
            announcements = announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc();
        }
        return announcements.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));
        }

        announcement.setTitle(request.title().trim());
        announcement.setContent(request.content().trim());
        if (request.targetRole() != null) announcement.setTargetRole(request.targetRole().toUpperCase());
        if (request.category() != null) announcement.setCategory(request.category().toUpperCase());
        announcement.setDepartment(department);
        if (request.pinned() != null) announcement.setPinned(request.pinned());

        return mapToResponse(announcementRepository.save(announcement));
    }

    @Override
    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));
        announcementRepository.delete(announcement);
    }

    @Override
    @Transactional
    public AnnouncementResponse togglePin(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));
        announcement.setPinned(!announcement.isPinned());
        return mapToResponse(announcementRepository.save(announcement));
    }

    private AnnouncementResponse mapToResponse(Announcement a) {
        String deptName = a.getDepartment() != null ? a.getDepartment().getName() : "All Departments";
        Long deptId = a.getDepartment() != null ? a.getDepartment().getId() : null;

        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getContent(),
                a.getTargetRole(),
                a.getCategory(),
                deptId,
                deptName,
                a.getAuthorName(),
                a.isPinned(),
                a.getCreatedAt()
        );
    }
}
