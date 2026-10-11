package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.announcement.AnnouncementRequest;
import com.sms.studentmanagementsystem.dto.announcement.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {

    AnnouncementResponse createAnnouncement(AnnouncementRequest request);

    List<AnnouncementResponse> getAllAnnouncements(String role);

    AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request);

    void deleteAnnouncement(Long id);

    AnnouncementResponse togglePin(Long id);
}
