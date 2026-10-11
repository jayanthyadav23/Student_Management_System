package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.audit.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void logAction(String action, String performedBy, String targetResource, String details);

    List<AuditLogResponse> getRecentLogs();
}
