package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryRequest;
import com.sms.studentmanagementsystem.dto.timetable.TimetableEntryResponse;

import java.util.List;

public interface TimetableService {

    TimetableEntryResponse createEntry(TimetableEntryRequest request);

    List<TimetableEntryResponse> getTimetable(Long departmentId, Integer semester, Long facultyId, Long courseId);

    TimetableEntryResponse updateEntry(Long id, TimetableEntryRequest request);

    void deleteEntry(Long id);
}
